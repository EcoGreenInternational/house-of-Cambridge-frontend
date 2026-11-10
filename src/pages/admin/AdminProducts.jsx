import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAdminProducts, fetchAdminOrders, fetchAdminCategories, fetchAdminBrands,
  createAdminProduct, updateAdminProduct, deleteAdminProduct,
  fetchGlobalDiscountStatus, manageGlobalDiscount,
  fetchCampaignSetting, updateCampaignSetting,
} from '../../redux/slices/adminSlice.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { ToastContainer } from '../../components/ui/Toast.jsx';
import useToast from '../../hooks/useToast.js';
import { CATEGORY_SPECIFICATIONS, categoryNameFrom } from '../../utils/categorySpecifications.js';
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2,
  FiChevronLeft, FiChevronRight, FiX, FiImage, FiDownload, FiPercent, FiCheck, FiZap,
} from 'react-icons/fi';

const PAGE_SIZE = 20;
const REPORT_HEADERS = [
  'Item ID', 'Item Name', 'Category', 'Unit Price (£)',
  'Stock', 'Available Stock', 'Reorder Level', 'Expiry Date',
  'Total Value (£)', 'Status',
];

const OPEN_STOCK_STATUSES = new Set(['pending', 'confirmed', 'processing']);

const csvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const productStock = (product) => {
  const variants = normalizeVariants(product.variants || []);
  if (variants.length > 0) {
    return variants.reduce((total, variant) => total + (Number(variant.stock) || 0), 0);
  }
  return Number(product.stock) || 0;
};

const formatReportDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
};

const buildOrderReservations = (orders) => {
  const reservations = new Map();
  orders.forEach((order) => {
    const status = String(order.orderStatus || order.status || '').toLowerCase();
    if (!OPEN_STOCK_STATUSES.has(status) || ['failed', 'refunded'].includes(String(order.paymentStatus || '').toLowerCase())) return;

    (Array.isArray(order.items) ? order.items : []).forEach((item) => {
      const product = item.product;
      const productId = item.productId || (typeof product === 'object' ? product?._id || product?.id : product);
      const quantity = Number(item.quantity);
      if (!productId || !Number.isFinite(quantity) || quantity <= 0) return;
      const key = String(productId);
      reservations.set(key, (reservations.get(key) || 0) + quantity);
    });
  });
  return reservations;
};

const buildInventoryCsv = (items, reservations) => {
  const rows = items.map((product) => {
    const quantity = productStock(product);
    const availableQuantity = Math.max(0, quantity - (reservations.get(String(product._id)) || 0));
    const reorderLevel = Number(product.reorderLevel);
    const price = Number(product.price) || 0;
    const threshold = Number.isFinite(reorderLevel) ? reorderLevel : null;
    const status = availableQuantity <= 0
      ? 'Out of Stock'
      : threshold !== null && availableQuantity <= threshold
        ? 'Reorder'
        : 'In Stock';

    return [
      product.productCode || product.sku || product._id || '—',
      product.name || '—',
      product.category?.name || product.category || '—',
      price.toFixed(2),
      quantity,
      availableQuantity,
      threshold ?? '—',
      formatReportDate(product.expiryDate || product.expiry),
      (price * quantity).toFixed(2),
      status,
    ].map(csvValue).join(',');
  });

  return [REPORT_HEADERS.map(csvValue).join(','), ...rows].join('\r\n');
};

const EMPTY = {
  name: '', description: '', usageInstructions: [],
  price: '', comparePrice: '', stock: '', sku: '',
  category: '', brand: '', weight: '',
  isActive: true, showInUserView: true, isFeatured: false, isPreOwned: false,
  isNewArrival: false, isFlashSale: false, flashSalePrice: '',
};

const INPUT_CLS =
  'w-full px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]';

const NUMERIC_FIELDS = [
  { key: 'price',          label: 'Price (Rs.)', required: true },
  { key: 'comparePrice',   label: 'Compare Price' },
  { key: 'stock',          label: 'Stock',        required: true },
  { key: 'flashSalePrice', label: 'Flash Sale Price' },
];

const FLAG_FIELDS = [
  { key: 'isActive',       label: 'Active' },
  { key: 'showInUserView', label: 'Show in User View' },
  { key: 'isFeatured',     label: 'Featured' },
  { key: 'isPreOwned',     label: 'Pre-Owned UK' },
  { key: 'isNewArrival',   label: 'New Arrival' },
  { key: 'isFlashSale',    label: 'Flash Sale' },
];

const CATEGORY_SPECIFIC_FIELDS = Object.fromEntries(Object.entries(CATEGORY_SPECIFICATIONS).map(([category, specs]) => [
  category,
  specs.map(([name, placeholder]) => ({ name, label: name, type: 'text', placeholder })),
]));

const toSpecFieldName = (key) =>
  key
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => (
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ))
    .join('');

const normalizeCategorySpecs = (specs) => {
  if (typeof specs === 'string' && specs.trim()) {
    try {
      return normalizeCategorySpecs(JSON.parse(specs));
    } catch {
      return [];
    }
  }
  if (!Array.isArray(specs)) return [];

  return specs
    .map((spec) => {
      const label = spec?.key ?? spec?.name ?? '';
      const fieldName = toSpecFieldName(label);
      if (!fieldName) return null;

      return {
        name: fieldName,
        label,
        type: 'text',
        placeholder: spec?.value ?? spec?.text ?? '',
      };
    })
    .filter(Boolean);
};

const normalizeBrandSpecs = (specs) => normalizeCategorySpecs(specs);

const normalizeVariantAttrs = (attrs) => {
  if (Array.isArray(attrs)) {
    return attrs.map((a) => ({
      name: a?.name ?? '',
      options: Array.isArray(a?.options)
        ? a.options.map((opt) => String(opt).trim()).filter(Boolean)
        : typeof a?.options === 'string'
          ? a.options.split(',').map((opt) => opt.trim()).filter(Boolean)
          : [],
    }));
  }
  if (typeof attrs === 'string' && attrs.trim()) {
    try {
      const parsed = JSON.parse(attrs);
      return Array.isArray(parsed) ? normalizeVariantAttrs(parsed) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeVariants = (variants, parentCode = '') => {
  if (Array.isArray(variants)) {
    return variants.map((v, idx) => {
      const code = v?.variantCode || (parentCode ? `${parentCode}-V${idx + 1}` : `HOC-V${idx + 1}`);
      return {
        _id: v?._id || v?.id || `var_${Date.now()}_${idx}`,
        variantCode: code,
        sku: v?.sku || code,
        name: v?.name || '',
        attributes: typeof v?.attributes === 'object' && v.attributes !== null ? v.attributes : {},
        price: v?.price !== undefined ? v.price : '',
        comparePrice: v?.comparePrice !== undefined ? v.comparePrice : '',
        weight: v?.weight !== undefined ? v.weight : '',
        stock: v?.stock !== undefined ? v.stock : '',
        image: v?.image && typeof v.image === 'object' ? v.image : { public_id: '', url: '' },
        imagePreview: v?.image?.url || '',
        imageFile: null,
        isActive: v?.isActive !== false,
      };
    });
  }
  if (typeof variants === 'string' && variants.trim()) {
    try {
      const parsed = JSON.parse(variants);
      return Array.isArray(parsed) ? normalizeVariants(parsed, parentCode) : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function AdminProducts() {
  const dispatch = useDispatch();
  const { products, productsTotal, categories, brands = [], loading, globalDiscount = {}, campaign = null } = useSelector((s) => s.admin);
  const { user } = useSelector((s) => s.auth);
  const { toasts, toast, removeToast } = useToast();

  const [search,         setSearch]         = useState('');
  const [catFilter,      setCatFilter]      = useState('');
  const [userViewFilter, setUserViewFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');

  // Campaign & Global Discount modal state
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountSubmitting, setDiscountSubmitting] = useState(false);

  const [campaignForm, setCampaignForm] = useState({
    theme: '11_11',
    campaignName: '11:11 Mega Sale',
    badgeText: '11:11 MEGA SHOPPING FESTIVAL',
    heading: '11 : 11',
    subheading: 'BIGGEST SALE OF THE YEAR',
    discountPercent: 5,
    greetingText: 'Applied automatically on EVERY product across the entire store!',
    ctaText: 'Claim 5% OFF & Shop Now',
    isEnabled: true,
    updateAllProductPrices: true,
  });

  const CAMPAIGN_PRESETS = {
    christmas: {
      theme: 'christmas',
      campaignName: 'Christmas Special',
      badgeText: '🎄 MERRY CHRISTMAS & HOLIDAY SALE 🎁',
      heading: 'MERRY CHRISTMAS',
      subheading: 'SEASON OF GIVING & JOY',
      discountPercent: 5,
      greetingText: 'Wishing you warmth, joy and festive cheer! Celebrate Christmas with an exclusive holiday discount on every product.',
      ctaText: 'Shop Christmas Deals Now 🎁',
      isEnabled: true,
      updateAllProductPrices: true,
    },
    '11_11': {
      theme: '11_11',
      campaignName: '11:11 Mega Sale',
      badgeText: '✦ 11:11 MEGA SHOPPING FESTIVAL ✦',
      heading: '11 : 11',
      subheading: 'BIGGEST SALE OF THE YEAR',
      discountPercent: 5,
      greetingText: 'Applied automatically on EVERY product across the entire store!',
      ctaText: 'Claim 5% OFF & Shop Now',
      isEnabled: true,
      updateAllProductPrices: true,
    },
    new_year: {
      theme: 'new_year',
      campaignName: 'New Year Special',
      badgeText: '✨ HAPPY NEW YEAR CELEBRATION ✨',
      heading: 'WELCOME 2027',
      subheading: 'NEW BEGINNINGS • SPECIAL OFFERS',
      discountPercent: 10,
      greetingText: 'Ring in the New Year with storewide festive savings on our entire collection!',
      ctaText: 'Explore New Year Specials ✨',
      isEnabled: true,
      updateAllProductPrices: true,
    },
  };

  const applyPreset = (presetKey) => {
    const p = CAMPAIGN_PRESETS[presetKey];
    if (p) {
      setCampaignForm((prev) => ({ ...prev, ...p }));
      toast.success(`Loaded "${p.campaignName}" preset!`);
    }
  };
  const [page,           setPage]           = useState(1);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [delLoading,     setDelLoading]     = useState(false);
  const [showForm,       setShowForm]       = useState(false);
  const [editing,        setEditing]        = useState(null);
  const [form,           setForm]           = useState(EMPTY);
  const [imageItems,     setImageItems]     = useState([]);
  const [saving,         setSaving]         = useState(false);
  const [reportLoading,  setReportLoading]  = useState(false);
  const [instrInput,     setInstrInput]     = useState('');
  const fileRef = useRef(null);

  const [attributes, setAttributes] = useState({});
  const [variantAttributes, setVariantAttributes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedVariantIndexes, setSelectedVariantIndexes] = useState({});
  const productCodeLabel = editing?.productCode;

  const pages = Math.ceil((productsTotal ?? 0) / PAGE_SIZE);

  const filteredBrands = useMemo(() =>
    brands.filter((b) =>
      b.isActive && (!form.category || b.category?._id === form.category || b.category === form.category)
    ),
  [brands, form.category]);


  const selectedCategory = useMemo(
    () => categories.find((c) => c._id === form.category) || null,
    [categories, form.category],
  );
  const selectedBrand = useMemo(
    () => brands.find((brand) => brand._id === form.brand) || null,
    [brands, form.brand],
  );

  const currentCategoryName = useMemo(() => {
    if (!selectedCategory) return '';

    return categoryNameFrom(selectedCategory.name);
  }, [selectedCategory]);

  const categorySpecificFields = useMemo(() => {
    const templateFields = normalizeCategorySpecs(selectedCategory?.specifications);
    if (templateFields.length) return templateFields;
    return CATEGORY_SPECIFIC_FIELDS[currentCategoryName] || [];
  }, [currentCategoryName, selectedCategory]);
  const brandSpecificFields = useMemo(
    () => normalizeBrandSpecs(selectedBrand?.specifications),
    [selectedBrand],
  );

  useEffect(() => {
    dispatch(fetchAdminCategories());
    dispatch(fetchAdminBrands());
    dispatch(fetchGlobalDiscountStatus());
    dispatch(fetchCampaignSetting());
  }, [dispatch]);

  useEffect(() => {
    if (campaign) {
      setCampaignForm((prev) => ({
        ...prev,
        theme: campaign.theme || prev.theme,
        campaignName: campaign.campaignName || prev.campaignName,
        badgeText: campaign.badgeText || prev.badgeText,
        heading: campaign.heading || prev.heading,
        subheading: campaign.subheading || prev.subheading,
        discountPercent: campaign.discountPercent ?? prev.discountPercent,
        greetingText: campaign.greetingText || prev.greetingText,
        ctaText: campaign.ctaText || prev.ctaText,
        isEnabled: campaign.isEnabled ?? prev.isEnabled,
      }));
    }
  }, [campaign]);

  useEffect(() => { load(search, catFilter, userViewFilter, approvalFilter, page); }, [page]);

  const load = useCallback((s = search, c = catFilter, uv = userViewFilter, ap = approvalFilter, p = page) => {
    dispatch(fetchAdminProducts({
      search:         s || undefined,
      category:       c || undefined,
      showInUserView: uv || undefined,
      approvalStatus: ap || undefined,
      page:           p,
      limit:          PAGE_SIZE,
    }));
  }, [dispatch, search, catFilter, userViewFilter, approvalFilter, page]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleCategorySelection = (e) => {
    const categoryId = e.target.value;
    setForm((f) => ({ ...f, category: categoryId, brand: '' }));

    const chosenCategory = categories.find((c) => c._id === categoryId);
    const templateFields = normalizeCategorySpecs(chosenCategory?.specifications);
    if (templateFields.length) {
      const nextAttributes = templateFields.reduce((acc, field) => {
        acc[field.name] = field.placeholder || '';
        return acc;
      }, {});
      setAttributes(nextAttributes);
    } else {
      setAttributes({}); 
    }

    if (chosenCategory?.variantAttributes?.length) {
      setVariantAttributes(normalizeVariantAttrs(chosenCategory.variantAttributes));
    }
  };

  const handleBrandSelection = (e) => {
    const brandId = e.target.value;
    const previousBrand = brands.find((item) => item._id === form.brand);
    setForm((f) => ({ ...f, brand: brandId }));
    const brand = brands.find((item) => item._id === brandId);
    const brandFields = normalizeBrandSpecs(brand?.specifications);
    const nextBrandAttributes = brandFields.reduce((acc, field) => {
      acc[field.name] = field.placeholder || '';
      return acc;
    }, {});
    setAttributes((current) => {
      const retained = Object.fromEntries(
        Object.entries(current).filter(([key]) =>
          !normalizeBrandSpecs(previousBrand?.specifications).some((field) => field.name === key)),
      );
      return { ...retained, ...nextBrandAttributes };
    });
  };

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(EMPTY);
    setAttributes({});
    setVariantAttributes([]);
    setVariants([]);
    setImageItems([]);
    setInstrInput('');
    setShowForm(true);
  }, []);

  const openEdit = useCallback((p) => {
    const normalizedVars = normalizeVariants(p.variants || [], p.productCode);
    const availableVariantStocks = normalizedVars
      .map((variant) => Number(variant.stock))
      .filter((stock) => Number.isFinite(stock) && stock > 0)
      .sort((a, b) => a - b);
    const defaultStock = normalizedVars.length > 0 ? (availableVariantStocks[0] ?? 0) : p.stock;

    setEditing(p);
    setForm({
      name:              p.name,
      description:       p.description || '',
      usageInstructions: Array.isArray(p.usageInstructions) ? p.usageInstructions : (p.usageInstructions ? [p.usageInstructions] : []),
      price:             p.price,
      comparePrice:      p.comparePrice || '',
      stock:             defaultStock,
      sku:               p.sku || '',
      category:          p.category?._id || p.category || '',
      brand:             p.brand?._id    || p.brand    || '',
      weight:            p.weight ?? '',
      isActive:          p.isActive,
      showInUserView:    p.showInUserView !== false,
      isFeatured:        p.isFeatured    || false,
      isPreOwned:        p.isPreOwned    || false,
      isNewArrival:      p.isNewArrival  || false,
      isFlashSale:       p.isFlashSale   || false,
      flashSalePrice:    p.flashSalePrice || '',
    });

    const loadedAttributes = {};
    if (Array.isArray(p.specifications)) {
      p.specifications.forEach((spec) => {
        if (spec.key && spec.value !== undefined && spec.value !== null) {
          const val = String(spec.value);
          const rawKey = String(spec.key).trim();
          const cleanKey = toSpecFieldName(rawKey);

          if (rawKey) loadedAttributes[rawKey] = val;
          if (cleanKey) loadedAttributes[cleanKey] = val;
        }
      });
    }
    setAttributes(loadedAttributes);

    const loadedVariantAttrs = p.variantAttributes?.length
      ? normalizeVariantAttrs(p.variantAttributes)
      : normalizeVariantAttrs(p.category?.variantAttributes || []);
    setVariantAttributes(loadedVariantAttrs);

    if (normalizedVars.length === 0 && loadedVariantAttrs.length > 0) {
      setVariants(buildVariantsFromAttributes(loadedVariantAttrs, []));
    } else {
      setVariants(normalizedVars);
    }

    setImageItems(p.images?.map((i) => ({ id: Math.random().toString() + Date.now(), url: i.url, existingImage: i })) || []);
    setInstrInput('');
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => { setShowForm(false); setEditing(null); }, []);

  // Variant Helpers
  const buildVariantsFromAttributes = (attrs, currentVariants) => {
    const activeAttrs = attrs.filter((va) => va.name.trim() && va.options.length > 0);
    if (!activeAttrs.length) return currentVariants;

    const cartesian = (arrays) =>
      arrays.reduce((acc, curr) => acc.flatMap((d) => curr.map((e) => [...d, e])), [[]]);

    const combinations = cartesian(activeAttrs.map((a) => a.options.map((opt) => ({ name: a.name, val: opt }))));

    const basePrice = form.price || 0;
    const baseCompare = form.comparePrice || 0;
    const baseWeight = form.weight || 0;
    const baseStock = form.stock || 0;
    const baseSku = form.sku || '';

    return combinations.map((combo, idx) => {
      const attrMap = {};
      combo.forEach((item) => {
        attrMap[item.name] = item.val;
      });
      const comboName = combo.map((c) => c.val).join(' / ');

      const existing = currentVariants.find((v) => v.name === comboName);
      if (existing) {
        if (!existing.sku) {
          existing.sku = baseSku ? `${baseSku}-V${idx + 1}` : `SKU-V${idx + 1}`;
        }
        return existing;
      }

      const variantSku = baseSku
        ? `${baseSku}-V${idx + 1}`
        : `VAR-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${idx + 1}`;

      return {
        _id: 'var_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
        sku: variantSku,
        name: comboName,
        attributes: attrMap,
        price: basePrice,
        comparePrice: baseCompare,
        weight: baseWeight,
        stock: baseStock,
        image: { public_id: '', url: '' },
        imagePreview: '',
        imageFile: null,
        isActive: true,
      };
    });
  };

  const addVariantAttribute = useCallback(() => {
    setVariantAttributes((prev) => [...prev, { name: '', options: [] }]);
  }, []);

  const removeVariantAttribute = useCallback((idx) => {
    setVariantAttributes((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setVariants((curr) => buildVariantsFromAttributes(next, curr));
      return next;
    });
  }, [form.price, form.comparePrice, form.weight, form.stock, form.sku]);

  const setVariantAttrName = useCallback((idx, name) => {
    setVariantAttributes((prev) => {
      const next = prev.map((item, i) => (i === idx ? { ...item, name } : item));
      setVariants((curr) => buildVariantsFromAttributes(next, curr));
      return next;
    });
  }, [form.price, form.comparePrice, form.weight, form.stock, form.sku]);

  const addVariantOption = useCallback((attrIdx, optVal) => {
    const trimmed = optVal.trim();
    if (!trimmed) return;
    setVariantAttributes((prev) => {
      const next = prev.map((item, i) => {
        if (i !== attrIdx) return item;
        if (item.options.includes(trimmed)) return item;
        return { ...item, options: [...item.options, trimmed] };
      });
      setVariants((curr) => buildVariantsFromAttributes(next, curr));
      return next;
    });
  }, [form.price, form.comparePrice, form.weight, form.stock, form.sku]);

  const removeVariantOption = useCallback((attrIdx, optIdx) => {
    setVariantAttributes((prev) => {
      const next = prev.map((item, i) =>
        i === attrIdx ? { ...item, options: item.options.filter((_, oi) => oi !== optIdx) } : item
      );
      setVariants((curr) => buildVariantsFromAttributes(next, curr));
      return next;
    });
  }, [form.price, form.comparePrice, form.weight, form.stock, form.sku]);

  const generateVariantMatrix = useCallback(() => {
    const activeAttrs = variantAttributes.filter((va) => va.name.trim() && va.options.length > 0);
    if (!activeAttrs.length) {
      toast.error('Please add at least one option type with values (e.g. Size: 200ml, 500ml)');
      return;
    }
    const newVariants = buildVariantsFromAttributes(variantAttributes, variants);
    setVariants(newVariants);
    toast.success(`Generated ${newVariants.length} variety item(s)`);
  }, [variantAttributes, variants, form.price, form.comparePrice, form.weight, form.stock, form.sku, toast]);

  const addCustomVariant = useCallback(() => {
    setVariants((prev) => {
      const idx = prev.length + 1;
      const baseSku = form.sku || '';
      const uniqueSku = baseSku
        ? `${baseSku}-V${idx}`
        : `VAR-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${idx}`;
      return [
        ...prev,
        {
          _id: 'var_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
          sku: uniqueSku,
          name: `Variant ${idx}`,
          attributes: {},
          price: form.price || 0,
          comparePrice: form.comparePrice || 0,
          weight: form.weight || 0,
          stock: form.stock || 0,
          image: { public_id: '', url: '' },
          imagePreview: '',
          imageFile: null,
          isActive: true,
        },
      ];
    });
  }, [form.sku, form.price, form.comparePrice, form.weight, form.stock]);

  const removeVariant = useCallback((idx) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const setVariantField = useCallback((idx, field, value) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  }, []);

  const handleVariantImageChange = useCallback((idx, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setVariants((prev) =>
      prev.map((v, i) =>
        i === idx
          ? { ...v, imageFile: file, imagePreview: preview }
          : v
      )
    );
  }, []);

  const handleOptionValueImageUpload = useCallback((optVal, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setVariants((prev) =>
      prev.map((v) => {
        const matches =
          (v.attributes && Object.values(v.attributes).some((x) => String(x).toLowerCase() === optVal.toLowerCase())) ||
          (v.name && v.name.toLowerCase().includes(optVal.toLowerCase()));
        if (matches) {
          return { ...v, imageFile: file, imagePreview: preview };
        }
        return v;
      })
    );
    toast.success(`Image applied to "${optVal}" varieties`);
  }, [toast]);

  const removeVariantImage = useCallback((idx) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === idx
          ? { ...v, imageFile: null, imagePreview: '', image: { public_id: '', url: '' } }
          : v
      )
    );
  }, []);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const newItems = selected.map((file) => ({
      id: Math.random().toString() + Date.now(),
      url: URL.createObjectURL(file),
      file,
    }));
    setImageItems((prev) => [...prev, ...newItems]);
    if (e.target) e.target.value = '';
  };

  const removeImage = (index) => {
    setImageItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addInstruction = () => {
    const trimmed = instrInput.trim();
    if (!trimmed) return;
    setForm((f) => ({ ...f, usageInstructions: [...f.usageInstructions, trimmed] }));
    setInstrInput('');
  };

  const removeInstruction = (i) =>
    setForm((f) => ({ ...f, usageInstructions: f.usageInstructions.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Product name is required');
    if (!form.price)       return toast.error('Price is required');
    if (form.stock === '') return toast.error('Stock is required');

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'usageInstructions') {
          v.filter(Boolean).forEach((item) => fd.append('usageInstructions', item));
        } else if (typeof v === 'boolean') {
          fd.append(k, String(v));
        } else if (v !== '') {
          fd.append(k, String(v));
        }
      });

  
      if (Object.keys(attributes).length > 0) {
        fd.append('attributes', JSON.stringify(attributes));
      }

      const hasMultipleVariants = variants.length > 1;

      if (hasMultipleVariants) {
        const cleanVariantAttrs = variantAttributes
          .filter((v) => v.name.trim())
          .map((v) => ({
            name: v.name.trim(),
            options: v.options.filter(Boolean),
          }));
        if (cleanVariantAttrs.length > 0) {
          fd.append('variantAttributes', JSON.stringify(cleanVariantAttrs));
        }

        const baseCode = productCodeLabel && productCodeLabel !== 'HOC-XXXX' ? productCodeLabel : (form.sku || 'HOC-0001');
        const cleanVariants = variants.map((v, idx) => {
          if (v.imageFile) {
            fd.append(`variant_image_${idx}`, v.imageFile);
          }
          const vCode = v.variantCode || `${baseCode}-V${idx + 1}`;
          const fallbackSku = v.sku || vCode;

          return {
            _id: v._id || v.id || undefined,
            variantCode: vCode,
            sku: String(fallbackSku).trim().slice(0, 100),
            name: String(v.name || '').trim().slice(0, 200),
            attributes: v.attributes || {},
            price: Number(v.price) >= 0 ? Number(v.price) : Number(form.price || 0),
            comparePrice: Number(v.comparePrice) >= 0 ? Number(v.comparePrice) : 0,
            weight: Number(v.weight) >= 0 ? Number(v.weight) : Number(form.weight || 0),
            stock: Number(v.stock) >= 0 ? Math.floor(Number(v.stock)) : Number(form.stock || 0),
            image: v.image && v.image.url ? v.image : { public_id: '', url: '' },
            isActive: v.isActive !== false,
          };
        });
        fd.append('variants', JSON.stringify(cleanVariants));
      } else {
        fd.append('variants', JSON.stringify([]));
        fd.append('variantAttributes', JSON.stringify([]));

        if (variants.length === 1) {
          const single = variants[0];
          if (single.price !== '' && Number(single.price) >= 0) fd.set('price', String(single.price));
          if (single.comparePrice !== '' && Number(single.comparePrice) >= 0) fd.set('comparePrice', String(single.comparePrice));
          if (single.stock !== '' && Number(single.stock) >= 0) fd.set('stock', String(single.stock));
          if (single.weight !== '' && Number(single.weight) >= 0) fd.set('weight', String(single.weight));
          if (single.sku) fd.set('sku', String(single.sku));
        }
      }

      const existingImages = imageItems
        .filter((item) => item.existingImage)
        .map((item) => item.existingImage);
      fd.append('existingImages', JSON.stringify(existingImages));

      const newFiles = imageItems
        .filter((item) => item.file)
        .map((item) => item.file);
      newFiles.forEach((f) => fd.append('images', f));

      const isSuperAdmin = user?.role === 'superadmin';
      if (editing) {
        await dispatch(updateAdminProduct({ id: editing._id, formData: fd })).unwrap();
        toast.success(isSuperAdmin ? 'Product updated and published' : 'Product updates submitted for Super Admin approval');
      } else {
        await dispatch(createAdminProduct(fd)).unwrap();
        toast.success(isSuperAdmin ? 'Product created and published' : 'New product submitted for Super Admin approval');
      }
      closeForm();
      load(search, catFilter, page);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDelLoading(true);
    try {
      await dispatch(deleteAdminProduct(deleteTarget._id)).unwrap();
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      load(search, catFilter, page);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Delete failed');
    } finally {
      setDelLoading(false);
    }
  };

  const isSuperAdmin = user?.role === 'superadmin';

  const handleToggleCampaign = async () => {
    if (!isSuperAdmin) return toast.error('Only super admins can activate or deactivate the campaign popup');

    const nextEnabled = !campaignForm.isEnabled;
    setDiscountSubmitting(true);
    try {
      const campaignUpdate = nextEnabled
        ? {
            ...campaignForm,
            isEnabled: true,
            discountPercent: Number(campaignForm.discountPercent),
            updateAllProductPrices: false,
          }
        : { isEnabled: false };
      const res = await dispatch(updateCampaignSetting(campaignUpdate)).unwrap();
      setCampaignForm((prev) => ({ ...prev, isEnabled: nextEnabled }));
      dispatch(fetchCampaignSetting());
      toast.success(res.message || `Campaign popup ${nextEnabled ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Could not update campaign popup');
    } finally {
      setDiscountSubmitting(false);
    }
  };

  const handleSaveCampaign = async () => {
    const percent = Number(campaignForm.discountPercent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      return toast.error('Please enter a valid discount percentage between 0 and 100');
    }

    setDiscountSubmitting(true);
    try {
      const res = await dispatch(updateCampaignSetting({
        ...campaignForm,
        discountPercent: percent,
      })).unwrap();

      toast.success(res.message || 'Campaign & storewide discounts updated!');
      setDiscountModalOpen(false);
      dispatch(fetchGlobalDiscountStatus());
      dispatch(fetchCampaignSetting());
      load(search, catFilter, userViewFilter, approvalFilter, page);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Action failed');
    } finally {
      setDiscountSubmitting(false);
    }
  };

  const handleResetDiscount = async () => {
    setDiscountSubmitting(true);
    try {
      const res = await dispatch(manageGlobalDiscount({
        action: 'reset',
        reason: 'Reset storewide discount',
      })).unwrap();

      toast.success(res.message || 'Global product discounts reset');
      setCampaignForm((prev) => ({ ...prev, discountPercent: 0 }));
      dispatch(fetchGlobalDiscountStatus());
      dispatch(fetchCampaignSetting());
      load(search, catFilter, userViewFilter, approvalFilter, page);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Action failed');
    } finally {
      setDiscountSubmitting(false);
    }
  };

  const downloadInventoryReport = async () => {
    setReportLoading(true);
    try {
      const reportProducts = [];
      let reportPage = 1;
      let total = 0;

      do {
        const result = await dispatch(fetchAdminProducts({
          search: search || undefined,
          category: catFilter || undefined,
          showInUserView: userViewFilter || undefined,
          page: reportPage,
          limit: PAGE_SIZE,
        })).unwrap();
        const pageProducts = Array.isArray(result.products) ? result.products : [];
        reportProducts.push(...pageProducts);
        total = Number.isFinite(result.total) ? result.total : reportProducts.length;
        reportPage += 1;
        if (pageProducts.length === 0) break;
      } while (reportProducts.length < total);

      const reportOrders = [];
      let orderPage = 1;
      let orderTotal = 0;
      do {
        const result = await dispatch(fetchAdminOrders({ page: orderPage, limit: PAGE_SIZE })).unwrap();
        const pageOrders = Array.isArray(result.orders) ? result.orders : [];
        reportOrders.push(...pageOrders);
        orderTotal = Number.isFinite(result.total) ? result.total : Number(result.count) || reportOrders.length;
        orderPage += 1;
        if (pageOrders.length === 0) break;
      } while (reportOrders.length < orderTotal);

      const reservations = buildOrderReservations(reportOrders);
      const blob = new Blob([`\uFEFF${buildInventoryCsv(reportProducts, reservations)}`], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      load(search, catFilter, userViewFilter, page);
      toast.success(`Inventory report downloaded (${reportProducts.length} products)`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Could not download inventory report');
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <h2 className="text-[20px] font-black text-[#1A1A1A]">
            Products <span className="text-[#60717B] font-normal text-[16px]">({productsTotal ?? 0})</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDiscountModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[13px] rounded-[8px] transition-all shadow-sm"
              title="Configure 11:11 storewide product discount"
            >
              <FiPercent size={15} className="text-[#FF8C00]" />
              <span>Campaign &amp; Global Discount</span>
              {globalDiscount.activeDiscountPercent > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#FFB700] text-[#1A1A1A] text-[10px] font-black">
                  {globalDiscount.activeDiscountPercent}% OFF ACTIVE
                </span>
              )}
            </button>
            <button
              onClick={downloadInventoryReport}
              disabled={reportLoading}
              className="flex items-center gap-2 px-4 py-2 border border-[#E9E9E9] bg-white text-[#1A1A1A] font-semibold text-[13px] rounded-[8px] hover:bg-[#FAFAFA] transition-colors disabled:opacity-50"
            >
              <FiDownload size={16} aria-hidden="true" />
              {reportLoading ? 'Preparing…' : 'Download Inventory'}
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFB700] text-[#1A1A1A] font-semibold text-[13px] rounded-[8px] hover:bg-amber-400 transition-colors"
            >
              <FiPlus size={16} aria-hidden="true" /> Add Product
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E9E9E9] p-4 flex flex-wrap gap-3">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(search, catFilter, userViewFilter, 1); }} className="flex gap-2 flex-1 min-w-[200px]" role="search">
            <div className="relative flex-1">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#60717B]" aria-hidden="true" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or SKU…"
                aria-label="Search products"
                className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-[#FFB700] text-[#1A1A1A] font-semibold text-[13px] rounded-[8px] hover:bg-amber-400 transition-colors">Search</button>
          </form>
          <select
            value={catFilter}
            onChange={(e) => { setCatFilter(e.target.value); setPage(1); load(search, e.target.value, userViewFilter, 1); }}
            aria-label="Filter by category"
            className="px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select
            value={userViewFilter}
            onChange={(e) => { setUserViewFilter(e.target.value); setPage(1); load(search, catFilter, e.target.value, approvalFilter, 1); }}
            aria-label="Filter by User View visibility"
            className="px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
          >
            <option value="">All User View Status</option>
            <option value="true">Shown in User View</option>
            <option value="false">Hidden in User View</option>
          </select>
          <select
            value={approvalFilter}
            onChange={(e) => { setApprovalFilter(e.target.value); setPage(1); load(search, catFilter, userViewFilter, e.target.value, 1); }}
            aria-label="Filter by Approval Status"
            className="px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
          >
            <option value="">All Approvals</option>
            <option value="approved">Approved & Live</option>
            <option value="pending">Pending Approval</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E9E9E9] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#FAFAFA] border-b border-[#E9E9E9]">
                <tr>
                  {['Image', 'Name', 'SKU', 'Product Code', 'Category', 'Brand', 'Price', 'Weight', 'Stock', 'Status', 'User View', 'Approval', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-[#60717B] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && !products.length ? (
                  <tr>
                    <td colSpan={13} className="text-center py-12 text-[#60717B]">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-[#FFB700] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                        Loading…
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={13} className="text-center py-12 text-[#60717B]">No products found</td></tr>
                ) : products.map((p) => {
                  const productVariants = normalizeVariants(p.variants || []);
                  const availableVariantIndexes = productVariants
                    .map((variant, index) => ({ index, stock: Number(variant.stock) }))
                    .filter(({ stock }) => Number.isFinite(stock) && stock > 0)
                    .sort((a, b) => a.stock - b.stock);
                  const defaultVariantIndex = availableVariantIndexes[0]?.index;
                  const savedVariantIndex = selectedVariantIndexes[p._id];
                  const selectedVariantIndex = savedVariantIndex !== undefined && productVariants[savedVariantIndex]
                    ? savedVariantIndex
                    : defaultVariantIndex;
                  const selectedVariant = selectedVariantIndex !== undefined
                    ? productVariants[Number(selectedVariantIndex)]
                    : null;
                  const displayedStock = productVariants.length > 0
                    ? (selectedVariant ? selectedVariant.stock : 0)
                    : p.stock;

                  return (
                  <tr key={p._id} className="border-b border-[#F4F5F7] hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3">
                      {p.images?.[0]?.url
                        ? <img src={p.images[0].url} alt={p.name} className="w-10 h-10 object-cover rounded-[6px]" />
                        : <div className="w-10 h-10 bg-[#F4F5F7] rounded-[6px] flex items-center justify-center"><FiImage size={16} className="text-[#C5C5C5]" aria-hidden="true" /></div>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1A1A1A]">{p.name}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {p.isFeatured   && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Featured</span>}
                        {p.isPreOwned   && <span className="text-[10px] bg-red-100    text-red-700    px-1.5 py-0.5 rounded font-medium">Pre-Owned</span>}
                        {p.isNewArrival && <span className="text-[10px] bg-green-100  text-green-700  px-1.5 py-0.5 rounded font-medium">New Arrival</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#60717B] font-mono text-[12px]">{p.sku || '—'}</td>
                    <td className="px-4 py-3 text-[#1A1A1A] font-mono text-[12px] font-semibold whitespace-nowrap">
                      {p.productCode || '—'}
                    </td>
                    <td className="px-4 py-3 text-[#60717B]">{p.category?.name || '—'}</td>
                    <td className="px-4 py-3">
                      {p.brand ? (
                        typeof p.brand === 'object' && p.brand.name ? (
                          //populated brand object from the server
                          <span className="px-2 py-0.5 bg-[#F4F5F7] text-[#1A1A1A] rounded-full text-[11px] font-semibold">
                            {p.brand.name}
                          </span>
                        ) : typeof p.brand === 'string' && !p.brand.match(/^[0-9a-fA-F]{24}$/) ? (
                          //  old text string name (like "Johnson's")
                          <span className="px-2 py-0.5 bg-[#F4F5F7] text-[#1A1A1A] rounded-full text-[11px] font-semibold">
                            {p.brand}
                          </span>
                        ) : (
                          // Fallback display for brand ID or unrecognized format
                          <span className="text-[#C5C5C5]">Saved (Refresh Page)</span>
                        )
                      ) : (
                        <span className="text-[#C5C5C5]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#1A1A1A]">
                      Rs.{p.price?.toLocaleString()}
                      {p.comparePrice > p.price && (
                        <span className="block text-[11px] text-[#60717B] font-normal line-through">Rs.{p.comparePrice?.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#60717B]">
                      {p.weight > 0
                        ? <span className="text-[12px] font-medium text-[#1A1A1A]">{p.weight} g</span>
                        : <span className="text-[#C5C5C5]">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className={`font-semibold ${displayedStock <= 5 ? 'text-red-600' : displayedStock <= 20 ? 'text-amber-600' : 'text-green-600'}`}>
                          {displayedStock}
                        </span>
                        {productVariants.length > 0 && (
                          <select
                            aria-label={`Stock by variety for ${p.name}`}
                            value={selectedVariantIndex ?? ''}
                            onChange={(e) => setSelectedVariantIndexes((current) => ({
                              ...current,
                              [p._id]: e.target.value,
                            }))}
                            className="block max-w-[125px] px-1.5 py-1 text-[10px] border border-[#E9E9E9] rounded-[4px] bg-[#FAFAFA] text-[#60717B] focus:outline-none focus:border-[#FFB700]"
                          >
                            <option value="" disabled>Variety stock</option>
                            {productVariants.map((variant, variantIndex) => (
                              <option key={`${variant.sku || variant.name}-${variantIndex}`} value={variantIndex}>
                                {variant.name || `Variety ${variantIndex + 1}`}: {variant.stock ?? 0}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${p.showInUserView !== false ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.showInUserView !== false ? 'Shown' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.approvalStatus === 'pending' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 whitespace-nowrap">
                          Pending Approval
                        </span>
                      ) : p.approvalStatus === 'rejected' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 whitespace-nowrap" title={p.approvalNote || 'Rejected'}>
                          Rejected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 whitespace-nowrap">
                          Approved
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`} className="text-[#60717B] hover:text-[#1A1A1A] transition-colors"><FiEdit2 size={15} /></button>
                        <button onClick={() => setDeleteTarget(p)} aria-label={`Delete ${p.name}`} className="text-[#60717B] hover:text-red-600 transition-colors"><FiTrash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="px-4 py-3 border-t border-[#E9E9E9] flex items-center justify-between">
              <p className="text-[13px] text-[#60717B]">Page {page} of {pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page" className="p-2 rounded-[6px] border border-[#E9E9E9] disabled:opacity-40 hover:bg-[#FAFAFA] transition-colors"><FiChevronLeft size={14} /></button>
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} aria-label="Next page" className="p-2 rounded-[6px] border border-[#E9E9E9] disabled:opacity-40 hover:bg-[#FAFAFA] transition-colors"><FiChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label={editing ? 'Edit Product' : 'Add Product'}>
          <div className="absolute inset-0 bg-black/40" onClick={closeForm} aria-hidden="true" />
          <div className="relative ml-auto w-full max-w-[560px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-white border-b border-[#E9E9E9] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-[16px] font-bold text-[#1A1A1A]">{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={closeForm} aria-label="Close drawer" className="text-[#60717B] hover:text-[#1A1A1A] transition-colors"><FiX size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
              <div>
                <label className="text-[13px] font-semibold text-[#1A1A1A] block mb-2">
                  Images <span className="text-[11px] font-normal text-[#60717B]">({imageItems.length} selected)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {imageItems.map((item, i) => (
                    <div key={item.id || i} className="relative group w-16 h-16 rounded-[8px] overflow-hidden border border-[#E9E9E9] bg-gray-50 shrink-0">
                      <img src={item.url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                        title="Remove image"
                        aria-label={`Remove image ${i + 1}`}
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    aria-label="Upload images"
                    className="w-16 h-16 border-2 border-dashed border-[#C5C5C5] rounded-[8px] flex flex-col items-center justify-center text-[#60717B] hover:border-[#FFB700] hover:text-[#FFB700] transition-colors shrink-0"
                  >
                    <FiImage size={18} aria-hidden="true" />
                    <span className="text-[9px] font-semibold mt-0.5">+ Add</span>
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFiles} />
              </div>

              <div>
                <label htmlFor="prod-name" className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">
                  Product Name <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input id="prod-name" value={form.name} onChange={setField('name')} required maxLength={300} className={INPUT_CLS} />
              </div>

              <div>
                <label htmlFor="prod-sku" className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">SKU</label>
                <input id="prod-sku" value={form.sku} onChange={setField('sku')} maxLength={100} className={INPUT_CLS} />
              </div>

              <div className="rounded-[8px] border border-dashed border-[#E9E9E9] bg-[#FAFAFA] px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#60717B] mb-0.5">Product Code</p>
                <p className="text-[13px] font-mono font-semibold text-[#1A1A1A]">{productCodeLabel}</p>
              </div>

              <div>
                <label htmlFor="prod-desc" className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">Description</label>
                <textarea id="prod-desc" value={form.description} onChange={setField('description')} rows={3} className={`${INPUT_CLS} resize-none`} />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">
                  Usage Instructions
                  <span className="ml-1.5 text-[11px] font-normal text-[#60717B]">({form.usageInstructions.length} points)</span>
                </label>
                {form.usageInstructions.length > 0 && (
                  <ol className="space-y-1.5 mb-2">
                    {form.usageInstructions.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 bg-[#FAFAFA] border border-[#E9E9E9] rounded-md px-3 py-2">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-[#FFB700] text-black text-[10px] font-bold flex items-center justify-center mt-0.5" aria-hidden="true">{i + 1}</span>
                        <span className="flex-1 text-[13px] text-[#1A1A1A] leading-snug">{pt}</span>
                        <button type="button" onClick={() => removeInstruction(i)} aria-label={`Remove instruction ${i + 1}`} className="shrink-0 text-gray-400 hover:text-red-500 transition-colors mt-0.5">
                          <FiTrash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
                <div className="flex gap-2">
                  <input
                    value={instrInput}
                    onChange={(e) => setInstrInput(e.target.value)}
                    placeholder="Type a point and press Enter or click Add…"
                    aria-label="New usage instruction"
                    className="flex-1 px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
                  />
                  <button type="button" onClick={addInstruction} className="px-3 py-2 bg-[#FFB700] text-black text-[13px] font-semibold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-1">
                    <FiPlus size={14} aria-hidden="true" /> Add
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {NUMERIC_FIELDS.map(({ key, label, required }) => (
                  <div key={key}>
                    <label htmlFor={`prod-${key}`} className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">
                      {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
                    </label>
                    <input id={`prod-${key}`} type="number" min={0} value={form[key]} onChange={setField(key)} required={required} className={INPUT_CLS} />
                  </div>
                ))}
              </div>

              <div>
                <label htmlFor="prod-weight" className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">
                  Weight
                  <span className="ml-1.5 text-[11px] font-normal text-[#60717B]">(grams — used to calculate delivery cost)</span>
                </label>
                <div className="relative">
                  <input id="prod-weight" type="number" min={0} step={1} value={form.weight} onChange={setField('weight')} placeholder="e.g. 500" className={`${INPUT_CLS} pr-10`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#60717B] pointer-events-none" aria-hidden="true">g</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prod-cat" className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">Category</label>
                  <select id="prod-cat" value={form.category} onChange={handleCategorySelection} className={INPUT_CLS}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="prod-brand" className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">Brand</label>
                  <select id="prod-brand" value={form.brand} onChange={handleBrandSelection} className={INPUT_CLS}>
                    <option value="">No brand</option>
                    {filteredBrands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              {categorySpecificFields.length > 0 && (
                <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-[8px] space-y-3">
                  <h4 className="text-[12px] font-bold text-[#FFB700] uppercase tracking-wider border-b border-amber-200/40 pb-1">
                     {currentCategoryName}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categorySpecificFields.map((field) => (
                      <div key={field.name} className="flex flex-col">
                        <label className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-1">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={attributes[field.name] ?? attributes[field.label] ?? ''}
                          onChange={(e) => setAttributes((prev) => ({ ...prev, [field.name]: e.target.value }))}
                          className="w-full px-3 py-1.5 text-[12px] border border-[#E9E9E9] rounded-[6px] bg-white focus:outline-none focus:border-[#FFB700]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {brandSpecificFields.length > 0 && (
                <div className="p-4 bg-blue-50/50 border border-blue-200/60 rounded-[8px] space-y-3">
                  <h4 className="text-[12px] font-bold text-blue-700 uppercase tracking-wider border-b border-blue-200/60 pb-1">
                    {selectedBrand.name} Specifications
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {brandSpecificFields.map((field) => (
                      <div key={field.name} className="flex flex-col">
                        <label className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-1">{field.label}</label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={attributes[field.name] ?? attributes[field.label] ?? ''}
                          onChange={(e) => setAttributes((prev) => ({ ...prev, [field.name]: e.target.value }))}
                          className="w-full px-3 py-1.5 text-[12px] border border-[#E9E9E9] rounded-[6px] bg-white focus:outline-none focus:border-[#FFB700]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Variations & Matrix Section */}
              <div className="border border-[#E9E9E9] rounded-[10px] p-4 bg-[#FAFAFA] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-[13px] font-bold text-[#1A1A1A]">Product Variations & Options</h4>
                    <p className="text-[11px] text-[#60717B]">
                      Manage sizes, colors, capacities, pack sizes, stock, prices, and <strong>variety images</strong>.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={addCustomVariant}
                      className="px-3 py-1.5 text-[11px] font-bold bg-[#FFB700] text-[#1A1A1A] rounded-[6px] hover:bg-amber-400 transition-colors shadow-sm flex items-center gap-1"
                    >
                      <FiPlus size={13} /> Add Variety
                    </button>
                    <button
                      type="button"
                      onClick={addVariantAttribute}
                      className="px-2.5 py-1.5 text-[11px] font-semibold bg-white border border-[#DCDCDC] text-[#1A1A1A] rounded-[6px] hover:border-[#FFB700] transition-colors"
                    >
                      + Option Type
                    </button>
                    <button
                      type="button"
                      onClick={generateVariantMatrix}
                      className="px-2.5 py-1.5 text-[11px] font-semibold bg-gray-100 border border-gray-200 text-[#1A1A1A] rounded-[6px] hover:bg-gray-200 transition-colors"
                    >
                      Generate Matrix
                    </button>
                  </div>
                </div>

                {/* Variant Attributes Definition */}
                {variantAttributes.length > 0 && (
                  <div className="space-y-2.5 bg-white p-3 rounded-[8px] border border-[#E9E9E9]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#60717B]">Option Types & Values</span>
                    {variantAttributes.map((va, aIdx) => (
                      <div key={aIdx} className="p-2.5 bg-[#F8F9FA] rounded-[6px] border border-[#EBEBEB] space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            placeholder="Option Name (e.g. Size Option, Color, Weight)"
                            value={va.name}
                            onChange={(e) => setVariantAttrName(aIdx, e.target.value)}
                            className="flex-1 px-2.5 py-1 text-[12px] font-medium border border-[#DCDCDC] rounded-[6px] bg-white focus:outline-none focus:border-[#FFB700]"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariantAttribute(aIdx)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            aria-label={`Remove option ${va.name}`}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>

                        {/* Values chips */}
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {va.options.map((opt, oIdx) => {
                            const optPreview = variants.find(
                              (v) =>
                                ((v.attributes && Object.values(v.attributes).some((x) => String(x).toLowerCase() === opt.toLowerCase())) ||
                                  (v.name && v.name.toLowerCase().includes(opt.toLowerCase()))) &&
                                v.imagePreview
                            )?.imagePreview;

                            return (
                              <span key={oIdx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#DCDCDC] hover:border-[#FFB700] rounded-[6px] text-[11px] text-[#1A1A1A] transition-colors shadow-2xs">
                                <label
                                  htmlFor={`opt-val-img-${aIdx}-${oIdx}`}
                                  className="cursor-pointer flex items-center justify-center text-[#60717B] hover:text-[#FFB700]"
                                  title={`Upload image for ${opt}`}
                                >
                                  {optPreview ? (
                                    <img src={optPreview} alt={opt} className="w-4 h-4 rounded-[2px] object-cover border border-amber-300" />
                                  ) : (
                                    <FiImage size={13} className="text-[#8C8C8C] hover:text-[#FFB700]" />
                                  )}
                                </label>
                                <input
                                  id={`opt-val-img-${aIdx}-${oIdx}`}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleOptionValueImageUpload(opt, e.target.files[0]);
                                      e.target.value = '';
                                    }
                                  }}
                                />
                                <span className="font-semibold">{opt}</span>
                                <button
                                  type="button"
                                  onClick={() => removeVariantOption(aIdx, oIdx)}
                                  className="text-gray-400 hover:text-red-600 ml-0.5"
                                  title={`Remove ${opt}`}
                                >
                                  <FiX size={11} />
                                </button>
                              </span>
                            );
                          })}
                          <div className="flex items-center gap-1.5">
                            <input
                              placeholder="+ Add value (e.g. 500ml)"
                              id={`prod-opt-input-${aIdx}`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addVariantOption(aIdx, e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                              className="w-36 px-2 py-0.5 text-[11px] border border-[#DCDCDC] rounded-[4px] bg-white focus:outline-none focus:border-[#FFB700]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(`prod-opt-input-${aIdx}`);
                                if (el && el.value) {
                                  addVariantOption(aIdx, el.value);
                                  el.value = '';
                                }
                              }}
                              className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-[11px] font-semibold rounded-[4px]"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Variant Combinations List / Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[12px] font-bold text-[#1A1A1A]">
                        Configured Varieties ({variants.length})
                      </span>
                      <p className="text-[10.5px] text-[#60717B]">
                        Click <strong>+ Image</strong> to upload a photo for each variety. It will display when a customer selects this variety.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addCustomVariant}
                      className="text-[11px] text-[#FFB700] hover:underline font-semibold flex items-center gap-1"
                    >
                      <FiPlus size={12} /> Add Variety
                    </button>
                  </div>

                  {variants.length > 0 ? (
                    <div className="overflow-x-auto border border-[#E9E9E9] rounded-[8px] bg-white">
                      <table className="w-full text-[11px]">
                        <thead className="bg-[#F8F9FA] border-b border-[#E9E9E9]">
                          <tr>
                            <th className="px-3 py-2 text-center font-bold text-[#1A1A1A] w-24">Variety Image</th>
                            <th className="px-3 py-2 text-left font-bold text-[#1A1A1A] min-w-[170px]">Variety Name / Options</th>
                            <th className="px-2.5 py-2 text-left font-semibold text-[#60717B]">SKU</th>
                            <th className="px-2.5 py-2 text-left font-semibold text-[#60717B]">Price (Rs.)</th>
                            <th className="px-2.5 py-2 text-left font-semibold text-[#60717B]">Compare Price (Rs.)</th>
                            <th className="px-2.5 py-2 text-left font-semibold text-[#60717B]">Weight (g)</th>
                            <th className="px-2.5 py-2 text-left font-semibold text-[#60717B]">Stock</th>
                            <th className="px-2.5 py-2 text-center font-semibold text-[#60717B]">Active</th>
                            <th className="px-2.5 py-2 text-center font-semibold text-[#60717B]"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F0F0]">
                          {variants.map((v, vIdx) => (
                            <tr key={vIdx} className="hover:bg-amber-50/20">
                              <td className="px-3 py-2 text-center">
                                <div className="flex flex-col items-center justify-center">
                                  {v.imagePreview ? (
                                    <div className="relative group w-11 h-11 rounded-[6px] overflow-hidden border-2 border-[#FFB700] bg-gray-50 flex-shrink-0 shadow-xs">
                                      <img
                                        src={v.imagePreview}
                                        alt={v.name || 'Variant'}
                                        className="w-full h-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeVariantImage(vIdx)}
                                        className="absolute inset-0 bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-semibold text-[10px]"
                                        title="Remove variety image"
                                      >
                                        <FiTrash2 size={13} className="text-red-400" />
                                      </button>
                                    </div>
                                  ) : (
                                    <label
                                      htmlFor={`variant-img-upload-${vIdx}`}
                                      className="w-11 h-11 border-2 border-dashed border-[#C5C5C5] hover:border-[#FFB700] rounded-[6px] flex flex-col items-center justify-center cursor-pointer text-[#60717B] hover:text-[#FFB700] bg-[#FAFAFA] hover:bg-amber-50/30 transition-all group"
                                      title="Upload image for this variety"
                                    >
                                      <FiImage size={15} className="group-hover:scale-110 transition-transform" />
                                      <span className="text-[8px] font-bold mt-0.5 leading-none text-[#60717B] group-hover:text-[#1A1A1A]">+ Image</span>
                                    </label>
                                  )}
                                  <input
                                    id={`variant-img-upload-${vIdx}`}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                        handleVariantImageChange(vIdx, e.target.files[0]);
                                        e.target.value = '';
                                      }
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2 min-w-[170px]">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap gap-1 items-center">
                                    {v.attributes && Object.keys(v.attributes).length > 0 ? (
                                      Object.entries(v.attributes).map(([key, val]) => (
                                        <span key={key} className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded text-[11px] font-bold">
                                          {val}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="font-bold text-[#1A1A1A] text-[12px]">{v.name}</span>
                                    )}
                                  </div>
                                  <input
                                    value={v.name}
                                    placeholder="Variant display name"
                                    onChange={(e) => setVariantField(vIdx, 'name', e.target.value)}
                                    className="w-full px-2 py-0.5 border border-[#E9E9E9] rounded-[4px] font-normal text-[#60717B] text-[10.5px]"
                                  />
                                  <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 inline-block mt-0.5" title={`Variety Code: ${v.variantCode}`}>
                                    Code: {v.variantCode || (productCodeLabel && productCodeLabel !== 'HOC-XXXX' ? `${productCodeLabel}-V${vIdx + 1}` : `HOC-0001-V${vIdx + 1}`)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-2.5 py-2">
                                <input
                                  placeholder={form.sku ? `${form.sku}-V${vIdx + 1}` : `SKU-V${vIdx + 1}`}
                                  value={v.sku}
                                  onChange={(e) => setVariantField(vIdx, 'sku', e.target.value)}
                                  className="w-28 px-2 py-1 border border-[#E9E9E9] focus:border-[#FFB700] focus:outline-none rounded-[4px] text-[11px] font-mono"
                                />
                              </td>
                              <td className="px-2.5 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  placeholder={String(form.price || 0)}
                                  value={v.price}
                                  onChange={(e) => setVariantField(vIdx, 'price', e.target.value)}
                                  className="w-20 px-2 py-1 border border-[#E9E9E9] rounded-[4px] text-[11px]"
                                />
                              </td>
                              <td className="px-2.5 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  placeholder={String(form.comparePrice || 0)}
                                  value={v.comparePrice}
                                  onChange={(e) => setVariantField(vIdx, 'comparePrice', e.target.value)}
                                  className="w-24 px-2 py-1 border border-[#E9E9E9] rounded-[4px] text-[11px]"
                                />
                              </td>
                              <td className="px-2.5 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  step={1}
                                  placeholder={String(form.weight || 0)}
                                  value={v.weight}
                                  onChange={(e) => setVariantField(vIdx, 'weight', e.target.value)}
                                  className="w-20 px-2 py-1 border border-[#E9E9E9] rounded-[4px] text-[11px]"
                                />
                              </td>
                              <td className="px-2.5 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  placeholder={String(form.stock || 0)}
                                  value={v.stock}
                                  onChange={(e) => setVariantField(vIdx, 'stock', e.target.value)}
                                  className="w-16 px-2 py-1 border border-[#E9E9E9] rounded-[4px] text-[11px]"
                                />
                              </td>
                              <td className="px-2.5 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={v.isActive}
                                  onChange={(e) => setVariantField(vIdx, 'isActive', e.target.checked)}
                                  className="w-3.5 h-3.5 accent-[#FFB700]"
                                />
                              </td>
                              <td className="px-2.5 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeVariant(vIdx)}
                                  className="text-gray-400 hover:text-red-600"
                                  title="Delete variety"
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-5 px-4 bg-white rounded-[8px] border border-dashed border-[#DCDCDC] space-y-2">
                      <FiImage size={24} className="mx-auto text-gray-400" />
                      <p className="text-[12px] font-semibold text-[#1A1A1A]">No varieties configured yet</p>
                      <p className="text-[11px] text-[#60717B]">
                        Click <strong>&quot;+ Add Variety&quot;</strong> to add varieties (like 200ml, 500ml) with variety images, prices, and stock quantities.
                      </p>
                      <button
                        type="button"
                        onClick={addCustomVariant}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFB700] text-[#1A1A1A] font-bold text-[11px] rounded-[6px] hover:bg-amber-400 mt-1"
                      >
                        <FiPlus size={13} /> Add Variety
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4" role="group" aria-label="Product flags">
                {FLAG_FIELDS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))} className="w-4 h-4 accent-[#FFB700]" />
                    <span className="text-[13px] text-[#1A1A1A] font-medium">{label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-2 border-t border-[#F0F0F0]">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 border border-[#E9E9E9] rounded-[8px] text-[13px] font-medium text-[#60717B] hover:bg-[#FAFAFA] transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#FFB700] rounded-[8px] text-[13px] font-bold text-[#1A1A1A] hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {saving && <span className="w-4 h-4 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" aria-hidden="true" />}
                  {editing ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign & Global Discount Manager Modal */}
      {discountModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[24px] max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E9E9E9] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFB700] text-[#1A1A1A] flex items-center justify-center font-black">
                  <FiPercent size={18} />
                </div>
                <div>
                  <h3 className="font-black text-[16px] text-[#1A1A1A]">
                    Celebration Popup &amp; Discount Manager
                  </h3>
                  <p className="text-[12px] text-[#60717B]">
                    {isSuperAdmin
                      ? 'Super Admin: Full Authority to Customize Theme, Texts & Storewide Discounts'
                      : 'Staff Admin: Submit Campaign Changes for Super Admin Approval'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDiscountModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-500"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-[13px]">
              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-2">
                  Quick Load Campaign Preset:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('christmas')}
                    className="px-3.5 py-1.5 rounded-[8px] bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-bold text-[12px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>🎄</span> Christmas Special
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('11_11')}
                    className="px-3.5 py-1.5 rounded-[8px] bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[12px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>🎉</span> 11:11 Mega Sale
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('new_year')}
                    className="px-3.5 py-1.5 rounded-[8px] bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 text-cyan-900 font-bold text-[12px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>✨</span> New Year Special
                  </button>
                </div>
              </div>

              {/* Theme & Popup Enabled */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAFAFA] p-4 rounded-[14px] border border-[#E9E9E9]">
                <div>
                  <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                    Visual Theme
                  </label>
                  <select
                    value={campaignForm.theme}
                    onChange={(e) => setCampaignForm((prev) => ({ ...prev, theme: e.target.value }))}
                    className="w-full px-3 py-2 text-[13px] font-semibold border border-[#E9E9E9] rounded-[8px] bg-white focus:outline-none focus:border-[#FFB700]"
                  >
                    <option value="11_11">🎉 11:11 (Gold &amp; Black Theme)</option>
                    <option value="christmas">🎄 Christmas (Festive Red, Green &amp; Snow ❄️)</option>
                    <option value="new_year">✨ New Year (Midnight Navy &amp; Cyan)</option>
                    <option value="default">✦ Classic Luxury (Brand Theme)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end gap-1.5">
                  <span className="text-[11px] font-semibold text-[#60717B]">
                    Visitor popup: {campaignForm.isEnabled ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleCampaign}
                    disabled={!isSuperAdmin || discountSubmitting}
                    title={isSuperAdmin ? undefined : 'Only super admins can change the live popup'}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-[8px] border text-[12px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      campaignForm.isEnabled
                        ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <FiZap size={14} aria-hidden="true" />
                    {campaignForm.isEnabled ? 'Deactivate Popup' : 'Activate Popup'}
                  </button>
                  {!isSuperAdmin && (
                    <span className="text-[10px] text-[#60717B]">Super admin permission required</span>
                  )}
                </div>
              </div>

              {/* Discount Percentage & Price Updates */}
              <div className="p-4 rounded-[14px] bg-amber-500/10 border border-amber-300/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                      Storewide Discount Percentage (%)
                    </label>
                    <p className="text-[11px] text-amber-800">
                      Calculates selling price for every product: Price = Base × (1 - Discount%)
                    </p>
                  </div>
                  <div className="w-24 relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={campaignForm.discountPercent}
                      onChange={(e) => setCampaignForm((prev) => ({ ...prev, discountPercent: e.target.value }))}
                      className="w-full px-3 py-2 text-[15px] font-black border border-amber-300 rounded-[8px] bg-white text-center focus:outline-none focus:border-[#FFB700]"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-black text-amber-700">%</span>
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={campaignForm.updateAllProductPrices}
                    onChange={(e) => setCampaignForm((prev) => ({ ...prev, updateAllProductPrices: e.target.checked }))}
                    className="w-4 h-4 accent-[#FFB700]"
                  />
                  <span className="text-[12px] font-bold text-amber-950">
                    Apply this {campaignForm.discountPercent}% discount to ALL active products in the store right now
                  </span>
                </label>
              </div>

              {/* Customizable Texts */}
              <div className="space-y-3">
                <h4 className="text-[12px] font-black text-[#1A1A1A] uppercase tracking-wider">
                  Customize Popup Greeting &amp; Texts:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#60717B] mb-1">Campaign Name</label>
                    <input
                      type="text"
                      value={campaignForm.campaignName}
                      onChange={(e) => setCampaignForm((prev) => ({ ...prev, campaignName: e.target.value }))}
                      placeholder="e.g. Christmas Special"
                      className="w-full px-3 py-2 text-[12px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#60717B] mb-1">Badge / Tagline</label>
                    <input
                      type="text"
                      value={campaignForm.badgeText}
                      onChange={(prev) => setCampaignForm((p) => ({ ...p, badgeText: prev.target.value }))}
                      placeholder="e.g. 🎄 MERRY CHRISTMAS &amp; HOLIDAY SALE"
                      className="w-full px-3 py-2 text-[12px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#60717B] mb-1">Big Main Heading</label>
                    <input
                      type="text"
                      value={campaignForm.heading}
                      onChange={(e) => setCampaignForm((prev) => ({ ...prev, heading: e.target.value }))}
                      placeholder="e.g. MERRY CHRISTMAS or 11 : 11"
                      className="w-full px-3 py-2 text-[12px] font-bold border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#60717B] mb-1">Subheading</label>
                    <input
                      type="text"
                      value={campaignForm.subheading}
                      onChange={(e) => setCampaignForm((prev) => ({ ...prev, subheading: e.target.value }))}
                      placeholder="e.g. SEASON OF GIVING &amp; JOY"
                      className="w-full px-3 py-2 text-[12px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#60717B] mb-1">Visitor Greeting / Description</label>
                  <textarea
                    rows={2}
                    value={campaignForm.greetingText}
                    onChange={(e) => setCampaignForm((prev) => ({ ...prev, greetingText: e.target.value }))}
                    placeholder="Wishing you warmth, joy and festive cheer! Celebrate Christmas with an exclusive holiday discount on every product."
                    className="w-full p-2.5 text-[12px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#60717B] mb-1">Call-To-Action Button Text</label>
                  <input
                    type="text"
                    value={campaignForm.ctaText}
                    onChange={(e) => setCampaignForm((prev) => ({ ...prev, ctaText: e.target.value }))}
                    placeholder="e.g. Shop Christmas Deals Now 🎁"
                    className="w-full px-3 py-2 text-[12px] font-semibold border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#E9E9E9] flex items-center justify-between gap-3">
              {globalDiscount.activeDiscountPercent > 0 && (
                <button
                  type="button"
                  onClick={handleResetDiscount}
                  disabled={discountSubmitting}
                  className="px-3.5 py-2.5 rounded-[8px] border border-rose-200 text-rose-600 hover:bg-rose-50 text-[12px] font-bold transition-colors cursor-pointer"
                >
                  Reset Discount
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setDiscountModalOpen(false)}
                  className="px-4 py-2.5 rounded-[8px] border border-[#E9E9E9] text-[13px] font-semibold text-[#60717B] hover:bg-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveCampaign}
                  disabled={discountSubmitting}
                  className="px-5 py-2.5 rounded-[8px] bg-gradient-to-r from-[#FFB700] to-[#FF8C00] text-[#1A1A1A] font-black text-[13px] hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {discountSubmitting && (
                    <span className="w-3.5 h-3.5 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
                  )}
                  {isSuperAdmin
                    ? 'Save & Update Storewide'
                    : 'Submit for Super Admin Approval'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone. Products in active orders cannot be deleted.`}
        confirmLabel="Delete"
        variant="danger"
        loading={delLoading}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
}
