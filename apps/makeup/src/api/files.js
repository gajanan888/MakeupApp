import api from './client';

export const uploadFile = async file => {
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
    name: file.name || 'upload',
    type: file.type || 'application/octet-stream',
  });

  try {
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
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
