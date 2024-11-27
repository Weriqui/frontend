import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

function DashboardChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/chamadas')
      .then(response => {
        setData(response.data);
      })
      .catch(error => {
        console.error("Erro ao buscar os dados", error);
      });
  }, []);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <XAxis dataKey="semana" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="api4com" fill="#5E81AC" />
        <Bar dataKey="callix" fill="#81A1C1" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default DashboardChart;
