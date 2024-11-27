import React from 'react';
import { TextField, MenuItem, Box } from '@mui/material';

function Filters() {
  const [filter, setFilter] = React.useState('');

  const handleChange = (event) => {
    setFilter(event.target.value);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
      <TextField
        select
        label="Selecione o filtro"
        value={filter}
        onChange={handleChange}
        variant="outlined"
        fullWidth
      >
        <MenuItem value="filtro1">Filtro 1</MenuItem>
        <MenuItem value="filtro2">Filtro 2</MenuItem>
        {/* Adicione mais filtros conforme necessário */}
      </TextField>
      {/* Adicione mais campos de filtro se necessário */}
    </Box>
  );
}

export default Filters;
