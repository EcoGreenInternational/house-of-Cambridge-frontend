import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, updateProfile } from '../../redux/slices/userSlice';
import ProfileLayout from '../../components/profile/ProfileLayout';
import { FiCamera, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../redux/api/axiosInstance';

const GENDERS   = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const LANGUAGES = ['English', 'Sinhala', 'Tamil'];

const FIELD_LIMITS = {
  firstName:   50,
  lastName:    50,
  displayName: 60,
  phone:       20,
};

const PHONE_RE    = /^[0-9\s\+\-\(\)]{7,20}$/;
const AVATAR_MAX  = 2 * 1024 * 1024;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const MAX_DOB = new Date();
MAX_DOB.setFullYear(MAX_DOB.getFullYear() - 13);
const MAX_DOB_STR = MAX_DOB.toISOString().split('T')[0];

function sanitize(value, maxLen) {
  return value.replace(/[<>"'`]/g, '').trimStart().slice(0, maxLen);
}

function validateForm(form) {
  if (!form.firstName.trim() || form.firstName.trim().length < 1)
    return 'First name is required.';
  if (form.phone && !PHONE_RE.test(form.phone))
    return 'Enter a valid phone number.';
  if (form.dob && form.dob > MAX_DOB_STR)
    return 'You must be at least 13 years old.';
  return null;
}

const INITIAL_FORM = {
  firstName: '', lastName: '', displayName: '',
  dob: '', gender: '', phone: '', language: 'English',
};

const inputCls = 'w-full border border-[#C5C5C5] rounded-[6px] px-3 py-2.5 text-[13px] outline-none focus:border-[#FFB700] bg-[#FAFAFA]';
const labelCls = 'block text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-1.5';

export default function EditProfile() {
  const dispatch  = useDispatch();
  const { profile } = useSelector((s) => s.user);
  const { user }    = useSelector((s) => s.auth);
  const fileRef     = useRef(null);

  const u = profile || user;

  const [form, setForm]               = useState(INITIAL_FORM);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [saving, setSaving]           = useState(false);

  useEffect(() => { dispatch(fetchProfile()); }, [dispatch]);

  useEffect(() => {
    if (u) {
      const parts = (u.name || '').split(' ');
      setForm({
        firstName:   sanitize(parts[0] || '', FIELD_LIMITS.firstName),
        lastName:    sanitize(parts.slice(1).join(' ') || '', FIELD_LIMITS.lastName),
        displayName: sanitize(u.displayName || u.name || '', FIELD_LIMITS.displayName),
        dob:         u.dob ? u.dob.slice(0, 10) : '',
        gender:      u.gender || '',
        phone:       sanitize(u.phone || '', FIELD_LIMITS.phone),
        language:    u.language || 'English',
      });
    }
  }, [u]);

  const set = useCallback((k, v) => {
    const limit = FIELD_LIMITS[k];
    setForm((f) => ({ ...f, [k]: limit ? sanitize(v, limit) : v }));
  }, []);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    const error = validateForm(form);
    if (error) { toast.error(error); return; }
    setSaving(true);
    try {
      const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
      const res  = await dispatch(updateProfile({
        name,
        phone:    form.phone,
        gender:   form.gender,
        dob:      form.dob,
        language: form.language,
      }));
      if (res.meta.requestStatus === 'fulfilled') toast.success('Profile updated!');
      else toast.error('Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [dispatch, form]);

  const handleAvatar = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error('Only JPG, PNG, GIF, or WebP images are accepted.');
      return;
    }
    if (file.size > AVATAR_MAX) {
      toast.error('Image must be under 2 MB.');
      return;
    }

    setAvatarLoading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      await api.put('/users/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      dispatch(fetchProfile());
      toast.success('Photo updated!');
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setAvatarLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [dispatch]);

  const handleRemoveAvatar = useCallback(async () => {
    try {
      await api.delete('/users/avatar');
      dispatch(fetchProfile());
      toast.success('Photo removed');
    } catch {
      toast.error('Remove failed. Please try again.');
    }
  }, [dispatch]);

  const handleCancel = useCallback(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  const initials = u?.name
    ? u.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <ProfileLayout>
      <form onSubmit={handleSave} noValidate>

        <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-5 shadow-[2px_3px_8px_rgba(0,0,0,0.04)] mb-4">
          <p className="text-[14px] font-black text-[#1A1A1A] mb-4">Profile Photo</p>
          <div className="flex items-center gap-5">
            {u?.avatar?.url ? (
              <img
                src={u.avatar.url}
                alt={`${u?.name ?? 'User'} profile photo`}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#FFB700] flex-shrink-0"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full bg-[#FFB700] flex items-center justify-center text-black font-black text-[22px] flex-shrink-0"
                aria-label={`Avatar initials: ${initials}`}
              >
                {initials}
              </div>
            )}
            <div>
              <p className="text-[13px] font-bold text-[#1A1A1A] mb-0.5">{u?.name}</p>
              <p className="text-[11px] text-[#60717B] mb-3">Accepted formats: JPG, PNG · Max size: 2MB</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarLoading}
                  className="flex items-center gap-1.5 bg-[#FFB700] text-black text-[12px] font-bold px-4 py-2 rounded-[6px] hover:bg-amber-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FiCamera size={13} aria-hidden="true" />
                  {avatarLoading ? 'Uploading…' : 'Upload New Photo'}
                </button>
                {u?.avatar?.url && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="flex items-center gap-1.5 border border-[#C5C5C5] text-[#60717B] text-[12px] font-semibold px-4 py-2 rounded-[6px] hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    <FiTrash2 size={13} aria-hidden="true" /> Remove Photo
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept={AVATAR_TYPES.join(',')}
                className="hidden"
                onChange={handleAvatar}
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-5 shadow-[2px_3px_8px_rgba(0,0,0,0.04)] mb-4">
          <p className="text-[14px] font-black text-[#1A1A1A] mb-4">Personal Information</p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="prof-firstName" className={labelCls}>
                First Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="prof-firstName"
                type="text"
                autoComplete="given-name"
                required
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                placeholder="Janith"
                maxLength={FIELD_LIMITS.firstName}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="prof-lastName" className={labelCls}>Last Name</label>
              <input
                id="prof-lastName"
                type="text"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                placeholder="Perera"
                maxLength={FIELD_LIMITS.lastName}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="prof-displayName" className={labelCls}>Display Name</label>
              <input
                id="prof-displayName"
                type="text"
                autoComplete="nickname"
                value={form.displayName}
                onChange={(e) => set('displayName', e.target.value)}
                placeholder="How you appear on reviews"
                maxLength={FIELD_LIMITS.displayName}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="prof-dob" className={labelCls}>Date of Birth</label>
              <input
                id="prof-dob"
                type="date"
                autoComplete="bday"
                value={form.dob}
                onChange={(e) => set('dob', e.target.value)}
                max={MAX_DOB_STR}
                className={inputCls}
              />
            </div>
          </div>

          <fieldset className="mb-3">
            <legend className={labelCls}>Gender</legend>
            <div className="flex flex-wrap gap-4">
              {GENDERS.map((g) => (
                <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={form.gender === g}
                    onChange={() => set('gender', g)}
                    className="accent-[#FFB700]"
                  />
                  <span className="text-[13px] text-[#1A1A1A]">{g}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="prof-phone" className={labelCls}>Phone Number</label>
              <input
                id="prof-phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+94 77 123 4567"
                maxLength={FIELD_LIMITS.phone}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="prof-email" className={labelCls}>Email Address</label>
              <input
                id="prof-email"
                type="email"
                value={u?.email || ''}
                disabled
                readOnly
                aria-describedby="email-change-note"
                className={`${inputCls} opacity-60 cursor-not-allowed`}
              />
            </div>
          </div>

          <div
            id="email-change-note"
            role="note"
            className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-[6px] px-3 py-2.5 mb-3"
          >
            <FiAlertCircle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              To change your email address, please contact support. A verification link will be sent to your new email.
            </p>
          </div>

          <div>
            <label htmlFor="prof-language" className={labelCls}>Language Preference</label>
            <select
              id="prof-language"
              value={form.language}
              onChange={(e) => set('language', e.target.value)}
              className={inputCls}
            >
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="border border-[#C5C5C5] text-[#1A1A1A] text-[13px] font-bold px-6 py-2.5 rounded-[6px] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#FFB700] text-black text-[13px] font-bold px-8 py-2.5 rounded-[6px] hover:bg-amber-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </ProfileLayout>
  );
}