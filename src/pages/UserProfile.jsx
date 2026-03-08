const [formData, setFormData] = useState({
  full_name: '',
  // ❌ REMOVE bio: '',
  avatar_url: '',
})

// Add image upload handler
const [uploading, setUploading] = useState(false)

const handleAvatarUpload = async (event) => {
  try {
    setUploading(true)
    const file = event.target.files[0]
    
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh')
      return
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ảnh không được quá 2MB')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath)

    setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
    setMessage({ type: 'success', text: 'Tải ảnh lên thành công!' })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    setMessage({ type: 'error', text: 'Lỗi tải ảnh: ' + error.message })
  } finally {
    setUploading(false)
  }
}

// Update form JSX
<form onSubmit={handleSubmit} className="space-y-4">
  {/* Full Name */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Full Name
    </label>
    <input
      type="text"
      name="full_name"
      value={formData.full_name}
      onChange={handleChange}
      className="input"
      disabled={saving}
    />
  </div>

  {/* ❌ REMOVE Bio field */}

  {/* Avatar Upload */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Avatar
    </label>
    
    {/* Preview */}
    {formData.avatar_url && (
      <div className="mb-3">
        <img 
          src={formData.avatar_url} 
          alt="Avatar preview" 
          className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
        />
      </div>
    )}
    
    {/* Upload Button */}
    <input
      type="file"
      accept="image/*"
      onChange={handleAvatarUpload}
      disabled={uploading || saving}
      className="block w-full text-sm text-gray-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-lg file:border-0
        file:text-sm file:font-semibold
        file:bg-blue-50 file:text-blue-700
        hover:file:bg-blue-100
        disabled:opacity-50"
    />
    <p className="text-xs text-gray-500 mt-1">
      Chọn ảnh (JPG, PNG, GIF, tối đa 2MB)
    </p>
  </div>

  {/* Submit */}
  <button type="submit" disabled={saving || uploading} className="btn btn-primary w-full">
    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
  </button>
</form>