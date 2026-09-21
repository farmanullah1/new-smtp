import { request } from './client';

export const createItem = (payload) => {
  return request('/items', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const getItems = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return request(`/items${queryString}`, {
    method: 'GET'
  });
};

export const getItemById = (id) => {
  return request(`/items/${id}`, {
    method: 'GET'
  });
};

export const updateItem = (id, payload) => {
  return request(`/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteItem = (id) => {
  return request(`/items/${id}`, {
    method: 'DELETE'
  });
};

export const getItemStats = () => {
  return request('/items/stats', {
    method: 'GET'
  });
};
