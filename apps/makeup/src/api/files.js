import api from './client';

export const sanitizeFileName = (name) => {
  if (!name || typeof name !== 'string') return 'upload.jpg';
  // Replace non-ASCII characters (like bullet • U+2022) and non-standard symbols with underscores
  const cleaned = name.replace(/[^\x00-\x7F]/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '_');
  return cleaned || 'upload.jpg';
};

export const uploadFile = async file => {
  const fileSize = Number(file?.fileSize || file?.size || 0);
  if (fileSize > 5 * 1024 * 1024) {
    throw new Error('File must be under 5MB.');
  }

  const formData = new FormData();

  const uri = file?.uri || '';
  let normalizedUri = uri;
  
  if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
    if (uri.startsWith('file:')) {
      normalizedUri = uri.replace(/^file:\/?\/?\/?/, 'file:///');
    } else {
      normalizedUri = `file://${uri}`;
    }
  }

  const rawName = file?.name || file?.fileName || 'upload.jpg';
  const safeName = sanitizeFileName(rawName);

  formData.append('file', {
    uri: normalizedUri,
    name: safeName,
    type: String(file?.type || 'image/jpeg').replace(/[^\x00-\x7F]/g, ''),
  });

  try {
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60s timeout for file/photo uploads
    });
    return response?.data?.data?.url;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Unable to upload file';

    throw new Error(message);
  }
};

