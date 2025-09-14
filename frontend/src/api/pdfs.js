import api from './index';

export const getPdfs = async () => {
  const response = await api.get('/pdfs');
  return response.data;
};

export const uploadPdf = async (file) => {
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await api.post('/pdfs/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deletePdf = async (uuid) => {
  const response = await api.delete(`/pdfs/${uuid}`);
  return response.data;
};

export const renamePdf = async (uuid, newName) => {
  const response = await api.put(`/pdfs/${uuid}`, { newName });
  return response.data;
};