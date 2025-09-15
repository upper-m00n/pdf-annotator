import api from './index';

export const getSummary = (pdfUuid) => {
  return api.post(`/nlp/summarize/${pdfUuid}`);
};