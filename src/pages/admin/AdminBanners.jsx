import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiArrowUp, FiArrowDown, FiX, FiUpload, FiEye, FiEyeOff, FiImage, FiExternalLink,
} from 'react-icons/fi';
import api from '../../redux/api/axiosInstance';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { ToastContainer } from '../../components/ui/Toast.jsx';
import useToast from '../../hooks/useToast.js';
import { setChristmasThemeCache } from '../../components/christmas/useChristmasTheme.js';
import { CHRISTMAS } from '../../components/christmas/christmasConfig.js';

const SECTIONS = [
  { id: 'hero', label: 'Hero slider', hint: 'Big sliding banners at the top of the home page.', size: '1920 × 600 px (phone: 750 × 900 px)' },
  { id: 'promo', label: 'Promo cards', hint: 'The 3 offer cards under the categories.', size: '800 × 420 px' },
  { id: 'department', label: 'Department cards', hint: 'The 3 slim cards between New Arrivals and Beauty.', size: '800 × 260 px' },
];

const BUTTON_STYLES = [
  { id: 'primary', label: 'Gold' },
  { id: 'secondary', label: 'White' },
  { id: 'outline', label: 'Outline' },
  { id: 'christmas', label: 'Christmas red' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WINDOW_TEXT = `${CHRISTMAS.START.day} ${MONTHS[CHRISTMAS.START.month - 1]} – ${CHRISTMAS.END.day} ${MONTHS[CHRISTMAS.END.month - 1]}`;

const EMPTY = {
  background: 'image',
  title: '',
  subtitle: '',
  link: '',
  showText: true,
  christmasFrame: false,
  isActive: true,
  startAt: '',
  endAt: '',
  buttons: [{ label: 'Shop Now', link: '/shop', style: 'primary' }],
};

const CHRISTMAS_TEMPLATE = {
  ...EMPTY,
  background: 'christmas',
  title: 'Merry Christmas',
  subtitle: 'Wrap up the perfect gifts for everyone you love',
  buttons: [
    { label: 'Shop Christmas Gifts', link: '/shop', style: 'christmas' },
    { label: 'Flash Deals', link: '/flash-sale', style: 'outline' },
  ],
};

const errMsg = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const toLocalInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const statusOf = (b) => {
  const now = Date.now();
  if (!b.isActive) return { label: 'Hidden', cls: 'bg-gray-100 text-gray-600' };
  if (b.endAt && new Date(b.endAt).getTime() < now) return { label: 'Ended', cls: 'bg-rose-50 text-rose-700' };
  if (b.startAt && new Date(b.startAt).getTime() > now) return { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700' };
  return { label: 'Live', cls: 'bg-emerald-50 text-emerald-700' };
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

function Thumb({ banner, className = '' }) {
  if (banner.background === 'christmas') {
    return (
      <div className={`flex items-center justify-center bg-[radial-gradient(circle_at_50%_30%,#e0303a,#5c0610)] text-white text-[11px] font-semibold italic ${className}`}>
        🎄 Christmas
      </div>
    );
  }
  if (banner.image?.url) return <img src={banner.image.url} alt="" className={`object-cover ${className}`} />;
  return (
    <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
      <FiImage />
    </div>
  );
}

function ImagePicker({ label, help, file, currentUrl, onFile, onRemove }) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : currentUrl), [file, currentUrl]);
  useEffect(() => () => file && URL.revokeObjectURL(preview), [file, preview]);
  return (
    <div>
      <p className="block text-[12px] font-bold text-[#1A1A1A] mb-1">{label}</p>
      <div className="flex items-center gap-3">
        <div className="w-36 h-20 rounded-[8px] border border-[#E9E9E9] overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
          {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : <FiImage className="text-gray-300" size={22} />}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-[#E9E9E9] text-[12px] font-semibold cursor-pointer hover:bg-gray-50">
            <FiUpload size={13} /> {preview ? 'Change image' : 'Upload image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = '';
              }}
            />
          </label>
          {preview && onRemove && (
            <button type="button" onClick={onRemove} className="text-[11px] text-rose-600 font-semibold text-left hover:underline">
              Remove
            </button>
          )}
        </div>
      </div>
      {help && <p className="text-[11px] text-[#60717B] mt-1">{help}</p>}
    </div>
  );
}

function BannerForm({ section, editing, initial, onClose, onSaved, toast }) {
  const [form, setForm] = useState(initial);
  const [image, setImage] = useState(null);
  const [mobileImage, setMobileImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [removeMobileImage, setRemoveMobileImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setButton = (i, patch) => set({ buttons: form.buttons.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) });
  const sectionInfo = SECTIONS.find((s) => s.id === section);

  const currentImage = removeImage ? '' : editing?.image?.url;
  const currentMobile = removeMobileImage ? '' : editing?.mobileImage?.url;

  const submit = async (e) => {
    e.preventDefault();
    if (form.background === 'image' && !image && !currentImage) {
      toast.error('Please upload a banner image, or choose the built-in Christmas background');
      return;
    }
    const buttons = form.buttons.filter((b) => b.label.trim());
    const data = new FormData();
    data.append('placement', section);
    data.append('background', form.background);
    data.append('title', form.title);
    data.append('subtitle', form.subtitle);
    data.append('link', form.link);
    data.append('showText', String(form.showText));
    data.append('christmasFrame', String(form.christmasFrame));
    data.append('isActive', String(form.isActive));
    data.append('startAt', form.startAt ? new Date(form.startAt).toISOString() : '');
    data.append('endAt', form.endAt ? new Date(form.endAt).toISOString() : '');
    data.append('buttons', JSON.stringify(buttons));
    if (image) data.append('image', image);
    if (mobileImage) data.append('mobileImage', mobileImage);
    if (removeImage && !image) data.append('removeImage', 'true');
    if (removeMobileImage && !mobileImage) data.append('removeMobileImage', 'true');

    setSaving(true);
    try {
      const res = editing ? await api.put(`/admin/banners/${editing._id}`, data) : await api.post('/admin/banners', data);
      toast.success(res.data?.message || 'Saved');
      onSaved();
    } catch (err) {
      toast.error(errMsg(err, 'Could not save banner'));
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full px-3 py-2 border border-[#E9E9E9] rounded-[8px] text-[13px] focus:outline-none focus:border-[#FFB700]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="bg-white rounded-[16px] w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
          <div>
            <h3 className="font-black text-[16px] text-[#1A1A1A]">{editing ? 'Edit banner' : 'Add banner'}</h3>
            <p className="text-[12px] text-[#60717B]">{sectionInfo.label} · {sectionInfo.hint}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <FiX />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div>
            <p className="text-[12px] font-bold text-[#1A1A1A] mb-2">Background</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'image', title: 'My own image', sub: 'Upload a picture' },
                { id: 'christmas', title: 'Christmas background', sub: 'Built-in red with pine & baubles — no upload' },
              ].map((o) => (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => set({ background: o.id })}
                  className={`text-left p-3 rounded-[10px] border-2 transition-colors ${
                    form.background === o.id ? 'border-[#FFB700] bg-amber-50' : 'border-[#E9E9E9] hover:border-gray-300'
                  }`}
                >
                  <p className="text-[13px] font-bold">{o.id === 'christmas' ? '🎄 ' : '🖼️ '}{o.title}</p>
                  <p className="text-[11px] text-[#60717B]">{o.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {form.background === 'image' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <ImagePicker
                label="Banner image"
                help={`Best size: ${sectionInfo.size.split(' (')[0]}. Max 5 MB.`}
                file={image}
                currentUrl={currentImage}
                onFile={(f) => { setImage(f); setRemoveImage(false); }}
                onRemove={editing?.image?.url || image ? () => { setImage(null); setRemoveImage(true); } : null}
              />
              {section === 'hero' && (
                <ImagePicker
                  label="Phone image (optional)"
                  help="Best size: 750 × 900 px. If empty, the main image is used."
                  file={mobileImage}
                  currentUrl={currentMobile}
                  onFile={(f) => { setMobileImage(f); setRemoveMobileImage(false); }}
                  onRemove={editing?.mobileImage?.url || mobileImage ? () => { setMobileImage(null); setRemoveMobileImage(true); } : null}
                />
              )}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold mb-1" htmlFor="bn-title">Title</label>
              <input id="bn-title" className={input} maxLength={120} value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Merry Christmas" />
            </div>
            <div>
              <label className="block text-[12px] font-bold mb-1" htmlFor="bn-sub">Subtitle</label>
              <input id="bn-sub" className={input} maxLength={240} value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="e.g. Gifts for everyone you love" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={form.showText} onChange={(e) => set({ showText: e.target.checked })} />
            Show title, subtitle and buttons on the banner
            <span className="text-[11px] text-[#60717B]">(turn off if your image already has text)</span>
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-bold">Buttons <span className="font-normal text-[#60717B]">(up to 3)</span></p>
              {form.buttons.length < 3 && (
                <button
                  type="button"
                  onClick={() => set({ buttons: [...form.buttons, { label: '', link: '/shop', style: 'primary' }] })}
                  className="text-[12px] font-semibold text-[#b07a00] hover:underline"
                >
                  + Add button
                </button>
              )}
            </div>
            {form.buttons.length === 0 && <p className="text-[12px] text-[#60717B]">No buttons — the whole banner links to the address below.</p>}
            <div className="space-y-2">
              {form.buttons.map((b, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input className={`${input} col-span-4`} maxLength={40} placeholder="Button text" value={b.label} onChange={(e) => setButton(i, { label: e.target.value })} />
                  <input className={`${input} col-span-4`} maxLength={300} placeholder="/shop" value={b.link} onChange={(e) => setButton(i, { link: e.target.value })} />
                  <select className={`${input} col-span-3`} value={b.style} onChange={(e) => setButton(i, { style: e.target.value })}>
                    {BUTTON_STYLES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <button
                    type="button"
                    aria-label="Remove button"
                    onClick={() => set({ buttons: form.buttons.filter((_, idx) => idx !== i) })}
                    className="col-span-1 h-9 rounded-[8px] text-rose-600 hover:bg-rose-50 flex items-center justify-center"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#60717B] mt-1">Links can be a page on this site (like /shop or /flash-sale) or a full https:// address.</p>
          </div>

          {form.buttons.length === 0 && (
            <div>
              <label className="block text-[12px] font-bold mb-1" htmlFor="bn-link">Banner link</label>
              <input id="bn-link" className={input} maxLength={300} value={form.link} onChange={(e) => set({ link: e.target.value })} placeholder="/shop" />
            </div>
          )}

          {form.background === 'image' && (
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={form.christmasFrame} onChange={(e) => set({ christmasFrame: e.target.checked })} />
              Add Christmas pine branches & baubles in the corners
            </label>
          )}

          <div>
            <p className="text-[12px] font-bold mb-1">Schedule <span className="font-normal text-[#60717B]">(optional)</span></p>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-[11px] text-[#60717B]">
                Show from
                <input type="datetime-local" className={input} value={form.startAt} onChange={(e) => set({ startAt: e.target.value })} />
              </label>
              <label className="text-[11px] text-[#60717B]">
                Hide after
                <input type="datetime-local" className={input} value={form.endAt} onChange={(e) => set({ endAt: e.target.value })} />
              </label>
            </div>
            <p className="text-[11px] text-[#60717B] mt-1">Example: show a Christmas banner only until 26 December. Leave empty to always show.</p>
          </div>

          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
            Show this banner on the website
          </label>
        </div>

        <div className="px-6 py-4 border-t border-[#E9E9E9] bg-[#FAFAFA] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-[8px] border border-[#E9E9E9] text-[13px] font-semibold text-[#60717B] hover:bg-white">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-5 py-2 rounded-[8px] bg-[#FFB700] text-[#1A1A1A] font-bold text-[13px] hover:bg-amber-500 disabled:opacity-50 flex items-center gap-2">
            {saving && <span className="w-3.5 h-3.5 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />}
            {editing ? 'Save changes' : 'Add banner'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminBanners() {
  const { toasts, toast, removeToast } = useToast();
  const [section, setSection] = useState('hero');
  const [all, setAll] = useState([]);
  const [christmas, setChristmas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [themeSaving, setThemeSaving] = useState(false);
  const [modal, setModal] = useState(null); // { editing, initial }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/banners');
      setAll(res.data?.banners || []);
      setChristmas(typeof res.data?.christmas === 'boolean' ? res.data.christmas : null);
    } catch (err) {
      toast.error(errMsg(err, 'Could not load banners'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const list = useMemo(() => all.filter((b) => b.placement === section), [all, section]);
  const info = SECTIONS.find((s) => s.id === section);

  const setTheme = async (value) => {
    setThemeSaving(true);
    try {
      const res = await api.put('/admin/banners/theme', { christmas: value });
      setChristmas(value);
      setChristmasThemeCache(value);
      toast.success(res.data?.message || 'Saved');
    } catch (err) {
      toast.error(errMsg(err, 'Could not change Christmas decorations'));
    } finally {
      setThemeSaving(false);
    }
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const ids = list.map((b) => b._id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await api.put('/admin/banners/reorder', { ids });
      await load();
    } catch (err) {
      toast.error(errMsg(err, 'Could not change order'));
    }
  };

  const toggleActive = async (b) => {
    const data = new FormData();
    data.append('isActive', String(!b.isActive));
    try {
      await api.put(`/admin/banners/${b._id}`, data);
      toast.success(b.isActive ? 'Banner hidden' : 'Banner shown');
      await load();
    } catch (err) {
      toast.error(errMsg(err, 'Could not update banner'));
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/banners/${deleteTarget._id}`);
      toast.success('Banner deleted');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(errMsg(err, 'Could not delete banner'));
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (b) =>
    setModal({
      editing: b,
      initial: {
        background: b.background || 'image',
        title: b.title || '',
        subtitle: b.subtitle || '',
        link: b.link || '',
        showText: b.showText !== false,
        christmasFrame: !!b.christmasFrame,
        isActive: b.isActive !== false,
        startAt: toLocalInput(b.startAt),
        endAt: toLocalInput(b.endAt),
        buttons: (b.buttons || []).map((x) => ({ label: x.label, link: x.link, style: x.style })),
      },
    });

  const themeLabel = christmas === null ? `Automatic (${WINDOW_TEXT})` : christmas ? 'On' : 'Off';

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-black text-[#1A1A1A]">Banners</h2>
            <p className="text-[13px] text-[#60717B]">Change the home page banners and buttons without touching code.</p>
          </div>
          <a href="/home" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 border border-[#E9E9E9] bg-white rounded-[8px] text-[13px] font-semibold hover:bg-[#FAFAFA]">
            <FiExternalLink size={14} /> View home page
          </a>
        </div>

        {/* Christmas switch */}
        <div className="rounded-[14px] p-5 text-white shadow-sm bg-[radial-gradient(ellipse_at_20%_0%,#e0303a,#8c0f1c_55%,#4d0610)] flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-black text-[16px]">🎄 Christmas decorations</p>
            <p className="text-[12px] text-white/85 max-w-xl">
              Snowfall, pine garland with baubles, hanging paper snowflakes, greeting bar and a snowman scene above the footer.
            </p>
            <p className="text-[12px] mt-1">Now: <span className="font-bold text-[#fde7a6]">{themeLabel}</span></p>
          </div>
          <div className="flex gap-2">
            {[
              { v: true, l: 'Turn on' },
              { v: false, l: 'Turn off' },
            ].map(({ v, l }) => (
              <button
                key={l}
                type="button"
                disabled={themeSaving || christmas === v}
                onClick={() => setTheme(v)}
                className={`px-4 py-2 rounded-[8px] text-[13px] font-bold transition-colors disabled:cursor-default ${
                  christmas === v ? 'bg-white text-[#8c0f1c]' : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex flex-wrap gap-1 bg-white p-1 rounded-[10px] border border-[#E9E9E9] w-fit">
          {SECTIONS.map((s) => {
            const count = all.filter((b) => b.placement === s.id).length;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-colors ${
                  section === s.id ? 'bg-[#FFB700] text-[#1A1A1A]' : 'text-[#60717B] hover:bg-gray-50'
                }`}
              >
                {s.label} {count > 0 && <span className="ml-1 text-[11px] opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-[12px] border border-[#E9E9E9] shadow-sm">
          <div className="px-5 py-4 border-b border-[#F0F0F0] flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-[14px]">{info.label}</p>
              <p className="text-[12px] text-[#60717B]">{info.hint} Recommended image size: {info.size}.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModal({ editing: null, initial: CHRISTMAS_TEMPLATE })}
                className="px-3.5 py-2 rounded-[8px] border border-rose-200 bg-rose-50 text-rose-700 text-[13px] font-bold hover:bg-rose-100"
              >
                🎄 Add Christmas banner
              </button>
              <button
                type="button"
                onClick={() => setModal({ editing: null, initial: EMPTY })}
                className="px-3.5 py-2 rounded-[8px] bg-[#FFB700] text-[#1A1A1A] text-[13px] font-bold hover:bg-amber-500 flex items-center gap-1.5"
              >
                <FiPlus /> Add banner
              </button>
            </div>
          </div>

          {loading ? (
            <p className="p-6 text-[13px] text-[#60717B]">Loading…</p>
          ) : list.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-semibold text-[14px]">No banners here yet</p>
              <p className="text-[12px] text-[#60717B] mt-1">
                The website is showing the built-in design for this section. Add a banner to replace it.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#F0F0F0]">
              {list.map((b, i) => {
                const st = statusOf(b);
                return (
                  <li key={b._id} className="p-4 flex flex-wrap items-center gap-4">
                    <Thumb banner={b} className="w-40 h-20 rounded-[8px] flex-shrink-0" />
                    <div className="flex-1 min-w-[180px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[14px] text-[#1A1A1A]">{b.title || <span className="text-[#60717B] font-normal">(no title)</span>}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                        {b.christmasFrame && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700">Pine frame</span>}
                      </div>
                      {b.subtitle && <p className="text-[12px] text-[#60717B] mt-0.5">{b.subtitle}</p>}
                      <p className="text-[11px] text-[#60717B] mt-1">
                        {b.buttons?.length ? `Buttons: ${b.buttons.map((x) => x.label).join(', ')}` : `Links to ${b.link || '/shop'}`}
                        {(b.startAt || b.endAt) && ` · ${b.startAt ? fmtDate(b.startAt) : 'now'} → ${b.endAt ? fmtDate(b.endAt) : 'no end'}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="w-8 h-8 rounded-[8px] hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center"><FiArrowUp size={15} /></button>
                      <button type="button" aria-label="Move down" disabled={i === list.length - 1} onClick={() => move(i, 1)} className="w-8 h-8 rounded-[8px] hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center"><FiArrowDown size={15} /></button>
                      <button type="button" aria-label={b.isActive ? 'Hide' : 'Show'} title={b.isActive ? 'Hide' : 'Show'} onClick={() => toggleActive(b)} className="w-8 h-8 rounded-[8px] hover:bg-gray-100 flex items-center justify-center">{b.isActive ? <FiEye size={15} /> : <FiEyeOff size={15} />}</button>
                      <button type="button" aria-label="Edit" onClick={() => openEdit(b)} className="w-8 h-8 rounded-[8px] hover:bg-gray-100 flex items-center justify-center"><FiEdit2 size={15} /></button>
                      <button type="button" aria-label="Delete" onClick={() => setDeleteTarget(b)} className="w-8 h-8 rounded-[8px] text-rose-600 hover:bg-rose-50 flex items-center justify-center"><FiTrash2 size={15} /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {modal && (
        <BannerForm
          key={modal.editing?._id || 'new'}
          section={section}
          editing={modal.editing}
          initial={modal.initial}
          toast={toast}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete banner"
        message={`Delete "${deleteTarget?.title || 'this banner'}"? Its images are removed too.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
}
