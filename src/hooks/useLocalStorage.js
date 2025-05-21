// src/hooks/useLocalStorage.js
import { useState, useEffect } from 'react';

function useLocalStorage(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      // se não existe, retorna o padrão
      if (item === null) {
        return defaultValue;
      }
      // tenta fazer o parse
      return JSON.parse(item);
    } catch (error) {
      console.warn(`useLocalStorage: erro ao ler a chave "${key}" do localStorage:`, error);
      // remove o valor corrompido e retorna o padrão
      window.localStorage.removeItem(key);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`useLocalStorage: erro ao gravar a chave "${key}" no localStorage:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

export default useLocalStorage;
