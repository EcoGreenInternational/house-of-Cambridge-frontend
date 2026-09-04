import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAdminProducts, fetchAdminCategories, fetchAdminBrands,
  createAdminProduct, updateAdminProduct, deleteAdminProduct,
} from '../../redux/slices/adminSlice.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { ToastContainer } from '../../components/ui/Toast.jsx';
import useToast from '../../hooks/useToast.js';
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2,
  FiChevronLeft, FiChevronRight, FiX, FiImage,
} from 'react-icons/fi';

const PAGE_SIZE = 20;

const EMPTY = {
  name: '', description: '', usageInstructions: [],
  price: '', comparePrice: '', stock: '', sku: '',
  category: '', brand: '', weight: '',
  isActive: true, isFeatured: false, isPreOwned: false,
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
  { key: 'isActive',     label: 'Active' },
  { key: 'isFeatured',   label: 'Featured' },
  { key: 'isPreOwned',   label: 'Pre-Owned UK' },
  { key: 'isNewArrival', label: 'New Arrival' },
  { key: 'isFlashSale',  label: 'Flash Sale' },
];

const CATEGORY_SPECIFIC_FIELDS = {
  'Beauty & Cosmetics': [
    { name: 'manufactureCountry', label: 'Manufacture Country', type: 'text', placeholder: 'France' },
    { name: 'suitableFor', label: 'Suitable For', type: 'text', placeholder: 'Adults, Unisex' },
    { name: 'skinHairType', label: 'Skin Hair Type', type: 'text', placeholder: 'Oily Skin, Dry Hair' },
    { name: 'keyIngredients', label: 'Key Ingredients', type: 'text', placeholder: 'Retinol, Vitamin C' },
  ],
  'Baby Care': [
    { name: 'manufactureCountry', label: 'Manufacture Country', type: 'text', placeholder: 'United Kingdom' },
    { name: 'ageRange', label: 'Age Range', type: 'text', placeholder: '0-6 Months' },
    { name: 'suitableFor', label: 'Suitable For', type: 'text', placeholder: 'Newborns' },
    { name: 'skinTypeCompatibility', label: 'Skin Type Compatibility', type: 'text', placeholder: 'Hypoallergenic' },
    { name: 'keyIngredients', label: 'Key Ingredients', type: 'text', placeholder: 'Aloe Vera, Chamomile' },
  ],
  'Home Appliances': [
    { name: 'manufactureCountry', label: 'Manufacture Country', type: 'text', placeholder: 'Germany' },
    { name: 'model', label: 'Model', type: 'text', placeholder: 'H-200' },
    { name: 'material', label: 'Material', type: 'text', placeholder: 'Stainless Steel, Plastic' },
    { name: 'dimensions', label: 'Dimensions (L × W × H)', type: 'text', placeholder: '30x20x15 cm' },
    { name: 'colour', label: 'Colour', type: 'text', placeholder: 'Silver, White' },
    { name: 'compatibility', label: 'Compatibility', type: 'text', placeholder: 'Standard Sink' },
    { name: 'packaging', label: 'Packaging', type: 'text', placeholder: 'Eco-friendly box' },
    { name: 'warranty', label: 'Warranty', type: 'text', placeholder: '1 Year' },
  ],
  'Electronics': [
    { name: 'model', label: 'Model', type: 'text', placeholder: 'E-X70' },
    { name: 'powerSupply', label: 'Power Supply', type: 'text', placeholder: '220V / Battery' },
    { name: 'material', label: 'Material', type: 'text', placeholder: 'Polycarbonate' },
    { name: 'colour', label: 'Colour', type: 'text', placeholder: 'Charcoal Black' },
    { name: 'compatibility', label: 'Compatibility', type: 'text', placeholder: 'Bluetooth 5.0 Devices' },
    { name: 'warranty', label: 'Warranty', type: 'text', placeholder: '2 Years' },
  ],
  'Computer & Printers': [
    { name: 'model', label: 'Model', type: 'text', placeholder: 'LaserJet Pro' },
    { name: 'processor', label: 'Processor / Chipset', type: 'text', placeholder: 'Intel i5 / Quad-Core' },
    { name: 'ram', label: 'RAM', type: 'text', placeholder: '8GB DDR4' },
    { name: 'storage', label: 'Storage (SSD / HDD)', type: 'text', placeholder: '512GB NVMe SSD' },
    { name: 'display', label: 'Display Size & Resolution', type: 'text', placeholder: '15.6" FHD' },
    { name: 'os', label: 'Operating System', type: 'text', placeholder: 'Windows 11' },
    { name: 'connectivity', label: 'Connectivity (USB, Bluetooth, Wi-Fi)', type: 'text', placeholder: 'USB 3.0, Wi-Fi 6' },
    { name: 'powerSupply', label: 'Power Supply', type: 'text', placeholder: '65W AC Adapter' },
    { name: 'colour', label: 'Colour', type: 'text', placeholder: 'Platinum Silver' },
    { name: 'compatibility', label: 'Compatibility', type: 'text', placeholder: 'Universal macOS & Windows' },
    { name: 'warranty', label: 'Warranty', type: 'text', placeholder: '3 Years' },
  ]
};

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

const normalizeVariants = (variants) => {
  if (Array.isArray(variants)) {
    return variants.map((v) => ({
      sku: v?.sku || '',
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
    }));
  }
  if (typeof variants === 'string' && variants.trim()) {
    try {
      const parsed = JSON.parse(variants);
      return Array.isArray(parsed) ? normalizeVariants(parsed) : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function AdminProducts() {
  const dispatch = useDispatch();
  const { products, productsTotal, categories, brands = [], loading } = useSelector((s) => s.admin);
  const { toasts, toast, removeToast } = useToast();

  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('');
  const [page,         setPage]         = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [delLoading,   setDelLoading]   = useState(false);
  const [showForm,     setShowForm]     = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [files,        setFiles]        = useState([]);
  const [previews,     setPreviews]     = useState([]);
  const [saving,       setSaving]       = useState(false);
  const [instrInput,   setInstrInput]   = useState('');
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

  const currentCategoryName = useMemo(() => {
    if (!selectedCategory) return '';

    const name = selectedCategory.name.trim().toLowerCase();
    if (name.includes('computer')) return 'Computer & Printers';
    if (name.includes('appliance') || name.includes('house')) return 'Home Appliances';
    if (name.includes('beauty')) return 'Beauty & Cosmetics';
    if (name.includes('baby')) return 'Baby Care';
    if (name.includes('elect')) return 'Electronics';

    return selectedCategory.name;
  }, [selectedCategory]);

  const categorySpecificFields = useMemo(() => {
    const templateFields = normalizeCategorySpecs(selectedCategory?.specifications);
    if (templateFields.length) return templateFields;
    return CATEGORY_SPECIFIC_FIELDS[currentCategoryName] || [];
  }, [currentCategoryName, selectedCategory]);

  useEffect(() => {
    dispatch(fetchAdminCategories());
    dispatch(fetchAdminBrands());
  }, [dispatch]);

  useEffect(() => { load(search, catFilter, page); }, [page]);

  const load = useCallback((s = search, c = catFilter, p = page) => {
    dispatch(fetchAdminProducts({
      search:   s || undefined,
      category: c || undefined,
      page:     p,
      limit:    PAGE_SIZE,
    }));
  }, [dispatch, search, catFilter, page]);

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

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(EMPTY);
    setAttributes({});
    setVariantAttributes([]);
    setVariants([]);
    setFiles([]);
    setPreviews([]);
    setInstrInput('');
    setShowForm(true);
  }, []);

  const openEdit = useCallback((p) => {
    const normalizedVars = normalizeVariants(p.variants || []);
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
      isFeatured:        p.isFeatured    || false,
      isPreOwned:        p.isPreOwned    || false,
      isNewArrival:      p.isNewArrival  || false,
      isFlashSale:       p.isFlashSale   || false,
      flashSalePrice:    p.flashSalePrice || '',
    });

    const loadedAttributes = {};
    if (Array.isArray(p.specifications)) {
      p.specifications.forEach((spec) => {
        if (spec.key && spec.value) {
          const camelKey = spec.key
            .replace(/[^a-zA-Z0-9\s]/g, '') // remove special chars like slashes
            .split(' ')
            .map((word, index) =>
              index === 0
                ? word.toLowerCase()
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join('');

          loadedAttributes[camelKey] = spec.value;
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

    setFiles([]);
    setPreviews(p.images?.map((i) => i.url) || []);
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
      const variantSku = baseSku ? `${baseSku}-V${idx + 1}` : '';

      const existing = currentVariants.find((v) => v.name === comboName);
      if (existing) return existing;

      return {
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
    setVariants((prev) => [
      ...prev,
      {
        sku: form.sku ? `${form.sku}-V${prev.length + 1}` : '',
        name: `Variant ${prev.length + 1}`,
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
    ]);
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
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
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
        } else if (v !== '') {
          fd.append(k, String(v));
        }
      });

  
      if (Object.keys(attributes).length > 0) {
        fd.append('attributes', JSON.stringify(attributes));
      }

      const cleanVariantAttrs = variantAttributes
        .filter((v) => v.name.trim())
        .map((v) => ({
          name: v.name.trim(),
          options: v.options.filter(Boolean),
        }));
      if (cleanVariantAttrs.length > 0) {
        fd.append('variantAttributes', JSON.stringify(cleanVariantAttrs));
      }

      if (variants.length > 0) {
        const cleanVariants = variants.map((v, idx) => {
          if (v.imageFile) {
            fd.append(`variant_image_${idx}`, v.imageFile);
          }
          return {
            sku: v.sku || '',
            name: v.name || '',
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
      }

      files.forEach((f) => fd.append('images', f));

      if (editing) {
        await dispatch(updateAdminProduct({ id: editing._id, formData: fd })).unwrap();
        toast.success('Product updated');
      } else {
        await dispatch(createAdminProduct(fd)).unwrap();
        toast.success('Product created');
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

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <h2 className="text-[20px] font-black text-[#1A1A1A]">
            Products <span className="text-[#60717B] font-normal text-[16px]">({productsTotal ?? 0})</span>
          </h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFB700] text-[#1A1A1A] font-semibold text-[13px] rounded-[8px] hover:bg-amber-400 transition-colors"
          >
            <FiPlus size={16} aria-hidden="true" /> Add Product
          </button>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E9E9E9] p-4 flex flex-wrap gap-3">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(search, catFilter, 1); }} className="flex gap-2 flex-1 min-w-[200px]" role="search">
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
            onChange={(e) => { setCatFilter(e.target.value); setPage(1); load(search, e.target.value, 1); }}
            aria-label="Filter by category"
            className="px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E9E9E9] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#FAFAFA] border-b border-[#E9E9E9]">
                <tr>
                  {['Image', 'Name', 'SKU', 'Product Code', 'Category', 'Brand', 'Price', 'Weight', 'Stock', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-[#60717B] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && !products.length ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-[#60717B]">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-[#FFB700] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                        Loading…
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-12 text-[#60717B]">No products found</td></tr>
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
                <label className="text-[13px] font-semibold text-[#1A1A1A] block mb-2">Images</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {previews.map((src, i) => (
                    <img key={i} src={src} alt={`Preview ${i + 1}`} className="w-16 h-16 object-cover rounded-[8px] border border-[#E9E9E9]" />
                  ))}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    aria-label="Upload images"
                    className="w-16 h-16 border-2 border-dashed border-[#C5C5C5] rounded-[8px] flex items-center justify-center text-[#60717B] hover:border-[#FFB700] hover:text-[#FFB700] transition-colors"
                  >
                    <FiImage size={20} aria-hidden="true" />
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
                  <select id="prod-brand" value={form.brand} onChange={setField('brand')} className={INPUT_CLS}>
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
                          value={attributes[field.name] || ''}
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
                                </div>
                              </td>
                              <td className="px-2.5 py-2">
                                <input
                                  placeholder="SKU"
                                  value={v.sku}
                                  onChange={(e) => setVariantField(vIdx, 'sku', e.target.value)}
                                  className="w-24 px-2 py-1 border border-[#E9E9E9] rounded-[4px] text-[11px] font-mono"
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