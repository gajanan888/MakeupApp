import api from './client';

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

  formData.append('file', {
    uri: normalizedUri,
    name: file.name || file.fileName || 'upload.jpg',
    type: file.type || 'image/jpeg',
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
