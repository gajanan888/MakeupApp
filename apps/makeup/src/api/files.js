import api from './client';

export const uploadFile = async file => {
  const formData = new FormData();

  const uri = file?.uri || '';
  const normalizedUri =
    uri.startsWith('file://') || uri.startsWith('content://')
      ? uri
      : `file://${uri}`;

  formData.append('file', {
    uri: normalizedUri,
    name: file.name || 'upload',
    type: file.type || 'application/octet-stream',
  });

  try {
    const response = await api.post('/api/upload', formData);
    return response?.data?.data?.url;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Unable to upload file';

    throw new Error(message);
  }
};
