import api from './client';

export const uploadFile = async (file) => {
  const formData = new FormData();

  formData.append('file', {
    uri: file.uri,
    name: file.name || 'upload',
    type: file.type || 'application/octet-stream',
  });

  const response = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response?.data?.data?.url;
};
