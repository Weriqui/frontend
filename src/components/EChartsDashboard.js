// src/components/EChartsDashboard.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import {
  Box,
  TextField,
  Checkbox,
  Autocomplete,
  Button,
  AppBar,
  Toolbar,
  Typography,
  Grid,
  Card,
  CardContent,
  Drawer,
  IconButton,
  Slider,
  Tabs,
  Tab,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { format, subDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import chartColors from './colors'; // Importa as cores
import MenuIcon from '@mui/icons-material/Menu';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ChromePicker } from 'react-color';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

function EChartsDashboard() {
  const [data, setData] = useState([]);
  const [option, setOption] = useState(null);
  const [lineChartOption, setLineChartOption] = useState(null);
  const [callixChartOption, setCallixChartOption] = useState(null);
  const [api4comChartOption, setApi4comChartOption] = useState(null);
  const [membros, setMembros] = useState([]);
  const [membrosSelecionados, setMembrosSelecionados] = useState(() => {
    const saved = localStorage.getItem('membrosSelecionados');
    return saved ? JSON.parse(saved) : [];
  });

  const [startDate, setStartDate] = useState(() => {
    const saved = localStorage.getItem('startDate');
    return saved ? new Date(saved) : subDays(new Date(), 6);
  });

  const [endDate, setEndDate] = useState(() => {
    const saved = localStorage.getItem('endDate');
    return saved ? new Date(saved) : new Date();
  });
  const [chamadasPeriodoAtual, setChamadasPeriodoAtual] = useState(0);
  const [comparacaoPeriodo, setComparacaoPeriodo] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const [qualificacoesSelecionadas, setQualificacoesSelecionadas] = useState([]);

  const [todasQualificacoes, setTodasQualificacoes] = useState([]);

  const [customization, setCustomization] = useState({
    chartColors: {
      api4com: chartColors.api4com,
      callix: chartColors.callix,
      qualificacoes: {}, // Inicializa como objeto vazio
    },
    backgroundType: 'color', // 'color', 'gradient', 'image'
    backgroundColor: chartColors.background,
    backgroundGradient: {
      from: '#ffffff',
      to: '#000000',
    },
    backgroundImage: '',
    mainChartHeight: 400,
    callixChartHeight: 400,
    api4comChartHeight: 400,
    lineChartHeight: 400,
    mainChartWidth: '100%',
    callixChartWidth: '100%',
    api4comChartWidth: '100%',
    lineChartWidth: '100%',
  });
  useEffect(() => {
    localStorage.setItem('membrosSelecionados', JSON.stringify(membrosSelecionados));
  }, [membrosSelecionados]);

  useEffect(() => {
    localStorage.setItem('startDate', startDate.toISOString());
  }, [startDate]);

  useEffect(() => {
    localStorage.setItem('endDate', endDate.toISOString());
  }, [endDate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://automation-pipe-af55514da494.herokuapp.com/api/chamadas');
        const dados = response.data;

        // Extrair membros únicos e apenas o primeiro nome
        const operadores = [
          ...new Set(
            dados.map((item) => (item.operador || '').split(' ')[0]).filter(Boolean)
          ),
        ];
        setMembros(operadores);
        setMembrosSelecionados(operadores);

        setData(dados);

        // Extrair todas as qualificações disponíveis
        const qualificacoes = [
          ...new Set(
            dados
              .filter((item) => item.plataforma === 'callix')
              .map((item) => item.qualificacao || 'Não Informado')
          ),
        ];

        setTodasQualificacoes(qualificacoes);

        // Inicializar cores para as qualificações
        setCustomization((prevCustomization) => {
          const newQualificacoesColors = { ...prevCustomization.chartColors.qualificacoes };
          let hasNew = false;
          let colorIndex = 0;
          const defaultColorPalette = [
            '#5470c6',
            '#91cc75',
            '#fac858',
            '#ee6666',
            '#73c0de',
            '#3ba272',
            '#fc8452',
            '#9a60b4',
            '#ea7ccc',
            // ... adicione mais cores se necessário
          ];

          qualificacoes.forEach((qualificacao) => {
            if (!(qualificacao in newQualificacoesColors)) {
              newQualificacoesColors[qualificacao] =
                defaultColorPalette[colorIndex % defaultColorPalette.length];
              colorIndex++;
              hasNew = true;
            }
          });

          if (hasNew) {
            return {
              ...prevCustomization,
              chartColors: {
                ...prevCustomization.chartColors,
                qualificacoes: newQualificacoesColors,
              },
            };
          } else {
            return prevCustomization;
          }
        });
      } catch (error) {
        console.error('Erro ao buscar os dados', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      processarDados();
    }
  }, [data, membrosSelecionados, startDate, endDate, customization, qualificacoesSelecionadas]);

  const processarDados = () => {
    let dadosFiltrados = data;

    // Filtrar por membros selecionados (apenas primeiro nome)
    if (membrosSelecionados.length > 0) {
      dadosFiltrados = dadosFiltrados.filter((item) =>
        membrosSelecionados.includes((item.operador || '').split(' ')[0])
      );
    }

    // Filtrar por intervalo de datas
    let dataInicio = startDate;
    let dataFim = endDate;

    dadosFiltrados = dadosFiltrados.filter((item) => {
      const dataItem = new Date(item.data);
      return dataItem >= dataInicio && dataItem <= dataFim;
    });

    // Total de chamadas no período atual
    const totalChamadasPeriodo = dadosFiltrados.length;
    setChamadasPeriodoAtual(totalChamadasPeriodo);

    // Comparação com o período anterior
    const diasPeriodo = differenceInDays(dataFim, dataInicio) + 1;
    const dataInicioAnterior = subDays(dataInicio, diasPeriodo);
    const dataFimAnterior = subDays(dataFim, diasPeriodo);

    const dadosPeriodoAnterior = data.filter((item) => {
      const dataItem = new Date(item.data);
      const operador = (item.operador || '').split(' ')[0];
      return (
        dataItem >= dataInicioAnterior &&
        dataItem <= dataFimAnterior &&
        membrosSelecionados.includes(operador)
      );
    });

    const totalChamadasAnterior = dadosPeriodoAnterior.length;
    const diferencaChamadas = totalChamadasPeriodo - totalChamadasAnterior;
    setComparacaoPeriodo(diferencaChamadas);

    // Gráfico Principal: Chamadas por Membro e Plataforma
    processarGraficoPrincipal(dadosFiltrados);

    // Gráfico Callix: Chamadas por Membro e Qualificação (Empilhado)
    processarGraficoCallix(dadosFiltrados);

    // Gráfico API4COM: Chamadas por Membro e Status (Atendida vs Não Atendida) (Empilhado)
    processarGraficoApi4com(dadosFiltrados);

    // Gráfico de Linha: Chamadas ao Longo do Tempo
    processarGraficoLinha(dadosFiltrados);
  };

  const processarGraficoPrincipal = (dadosFiltrados) => {
    // Agrupar dados por operador (primeiro nome) e plataforma
    const operadoresMap = {};
    dadosFiltrados.forEach((item) => {
      const operadorCompleto = item.operador || '';
      const operador = operadorCompleto.split(' ')[0];

      if (operador) {
        const plataforma = item.plataforma;

        if (!operadoresMap[operador]) {
          operadoresMap[operador] = { API4COM: 0, CALLIX: 0 };
        }

        if (plataforma === 'api4com') {
          operadoresMap[operador].API4COM += 1;
        } else if (plataforma === 'callix') {
          operadoresMap[operador].CALLIX += 1;
        }
      }
    });

    const nomes = Object.keys(operadoresMap);
    const api4comData = nomes.map((operador) => operadoresMap[operador].API4COM);
    const callixData = nomes.map((operador) => operadoresMap[operador].CALLIX);

    // Ordenar operadores por total de chamadas
    const operadoresData = nomes.map((operador, index) => ({
      operador,
      API4COM: api4comData[index],
      CALLIX: callixData[index],
      total: api4comData[index] + callixData[index],
    }));

    operadoresData.sort((a, b) => b.total - a.total);

    const nomesOrdenados = operadoresData.map((item) => item.operador);
    const api4comDataOrdenado = operadoresData.map((item) => item.API4COM);
    const callixDataOrdenado = operadoresData.map((item) => item.CALLIX);

    const totalData = operadoresData.map((item) => item.total);

    const series = [
      {
        name: 'API4COM',
        type: 'bar',
        stack: 'total',
        data: api4comDataOrdenado,
        itemStyle: {
          color: customization.chartColors.api4com,
        },
        label: {
          show: false,
        },
        emphasis: {
          focus: 'series',
        },
        minHeight: 5,
      },
      {
        name: 'CALLIX',
        type: 'bar',
        stack: 'total',
        data: callixDataOrdenado,
        itemStyle: {
          color: customization.chartColors.callix,
        },
        label: {
          show: false,
        },
        emphasis: {
          focus: 'series',
        },
        minHeight: 5,
      },
      // Série para os totais
      {
        name: 'Total',
        type: 'bar',
        data: totalData,
        barGap: '-100%',
        barWidth: '0%',
        itemStyle: {
          color: 'transparent',
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}',
          color: chartColors.axisText,
          distance: 10,
        },
        emphasis: {
          focus: 'series',
        },
        z: 10,
      },
    ];

    // Configuração do gráfico principal
    setOption({
      backgroundColor:
        customization.backgroundType === 'color' ? customization.backgroundColor : 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: chartColors.tooltipBackgroundColor,
        textStyle: {
          color: chartColors.axisText,
        },
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params) => {
          let total = 0;
          let tooltipText = `<strong>${params[0].name}</strong><br/>`;
          params.forEach((param) => {
            if (param.seriesName !== 'Total') {
              total += param.value;
              tooltipText += `${param.seriesName}: ${param.value}<br/>`;
            }
          });
          tooltipText += `<strong>Total: ${total}</strong>`;
          return tooltipText;
        },
      },
      legend: {
        data: ['API4COM', 'CALLIX'],
        textStyle: {
          color: chartColors.axisText,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: nomesOrdenados.length > 10 ? 80 : 50,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: nomesOrdenados,
        axisLine: {
          lineStyle: {
            color: chartColors.axisText,
          },
        },
        axisLabel: {
          fontSize: 12,
          color: chartColors.axisText,
          rotate: nomesOrdenados.length > 10 ? 45 : 0,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: chartColors.axisText,
          },
        },
        splitLine: {
          lineStyle: {
            color: chartColors.gridLineColor,
          },
        },
        axisLabel: {
          color: chartColors.axisText,
        },
      },
      series,
    });
  };

  const processarGraficoCallix = (dadosFiltrados) => {
    // Filtrar apenas dados do Callix
    const dadosCallix = dadosFiltrados.filter((item) => item.plataforma === 'callix');

    // Extrair qualificações únicas
    const qualificacoesSet = new Set(
      dadosCallix.map((item) => item.qualificacao || 'Não Informado')
    );
    const qualificacoes = Array.from(qualificacoesSet);

    // Filtrar as qualificações selecionadas
    const qualificacoesFiltradas =
      qualificacoesSelecionadas.length > 0 ? qualificacoesSelecionadas : [];

    // Inicializar mapa de operadores
    const operadoresMap = {};
    dadosCallix.forEach((item) => {
      const operadorCompleto = item.operador || '';
      const operador = operadorCompleto.split(' ')[0];

      if (operador) {
        if (!operadoresMap[operador]) {
          operadoresMap[operador] = {};
          // Inicializar contagens para qualificações selecionadas
          qualificacoesFiltradas.forEach((q) => {
            operadoresMap[operador][q] = 0;
          });
        }
        const qualificacao = item.qualificacao || 'Não Informado';
        if (qualificacoesFiltradas.includes(qualificacao)) {
          operadoresMap[operador][qualificacao] =
            (operadoresMap[operador][qualificacao] || 0) + 1;
        }
      }
    });

    const operadores = Object.keys(operadoresMap);

    // Calcular totais por operador
    const totalData = operadores.map((operador) => {
      return qualificacoesFiltradas.reduce(
        (sum, q) => sum + (operadoresMap[operador][q] || 0),
        0
      );
    });

    // Construir as séries
    const series = qualificacoesFiltradas
      .map((qualificacao) => {
        const data = operadores.map(
          (operador) => operadoresMap[operador][qualificacao] || 0
        );
        const hasData = data.some((value) => value > 0);

        if (hasData) {
          return {
            name: qualificacao,
            type: 'bar',
            stack: 'total',
            data,
            itemStyle: {
              color:
                customization.chartColors.qualificacoes?.[qualificacao] ||
                chartColors.defaultBarColor,
            },
            label: {
              show: false,
            },
            minHeight: 5,
          };
        } else {
          return null;
        }
      })
      .filter(Boolean); // Remove séries sem dados

    // Adicionar série para os totais se houver dados
    if (series.length > 0) {
      series.push({
        name: 'Total',
        type: 'bar',
        data: totalData,
        barGap: '-100%',
        barWidth: '0%',
        itemStyle: {
          color: 'transparent',
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}',
          color: chartColors.axisText,
          distance: 10,
        },
        emphasis: {
          focus: 'series',
        },
        z: 10,
      });
    }

    // Configuração do gráfico do Callix
    setCallixChartOption({
      backgroundColor:
        customization.backgroundType === 'color' ? customization.backgroundColor : 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: chartColors.tooltipBackgroundColor,
        textStyle: {
          color: chartColors.axisText,
        },
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params) => {
          let total = 0;
          let tooltipText = `<strong>${params[0].name}</strong><br/>`;
          params.forEach((param) => {
            if (param.seriesName !== 'Total') {
              total += param.value;
              tooltipText += `${param.seriesName}: ${param.value}<br/>`;
            }
          });
          tooltipText += `<strong>Total: ${total}</strong>`;
          return tooltipText;
        },
      },
      legend: {
        data: series.map((s) => s.name).filter((name) => name !== 'Total'),
        textStyle: {
          color: chartColors.axisText,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: operadores.length > 10 ? 80 : 50,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: operadores,
        axisLine: {
          lineStyle: {
            color: chartColors.axisText,
          },
        },
        axisLabel: {
          color: chartColors.axisText,
          rotate: operadores.length > 10 ? 45 : 0,
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: chartColors.axisText,
          },
        },
        splitLine: {
          lineStyle: {
            color: chartColors.gridLineColor,
          },
        },
        axisLabel: {
          color: chartColors.axisText,
        },
      },
      series,
    });
  };

  const processarGraficoApi4com = (dadosFiltrados) => {
    // Filtrar apenas dados do API4COM
    const dadosApi4com = dadosFiltrados.filter((item) => item.plataforma === 'api4com');

    // Inicializar mapa de operadores
    const operadoresMap = {};
    dadosApi4com.forEach((item) => {
      const operadorCompleto = item.operador || '';
      const operador = operadorCompleto.split(' ')[0];

      if (operador) {
        if (!operadoresMap[operador]) {
          operadoresMap[operador] = { Atendida: 0, 'Não Atendida': 0 };
        }
        const status = item.atendida ? 'Atendida' : 'Não Atendida';
        operadoresMap[operador][status] += 1;
      }
    });

    const operadores = Object.keys(operadoresMap);

    const totalData = operadores.map((operador) => {
      return (
        operadoresMap[operador]['Atendida'] + operadoresMap[operador]['Não Atendida']
      );
    });

    const series = ['Atendida', 'Não Atendida'].map((status) => ({
      name: status,
      type: 'bar',
      stack: 'total',
      data: operadores.map((operador) => operadoresMap[operador][status]),
      label: {
        show: false,
      },
      minHeight: 5,
    }));

    // Adicionar série para os totais
    series.push({
      name: 'Total',
      type: 'bar',
      data: totalData,
      barGap: '-100%',
      barWidth: '0%',
      itemStyle: {
        color: 'transparent',
      },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}',
        color: chartColors.axisText,
        distance: 10,
      },
      emphasis: {
        focus: 'series',
      },
      z: 10,
    });

    // Configuração do gráfico do API4COM
    setApi4comChartOption({
      backgroundColor:
        customization.backgroundType === 'color' ? customization.backgroundColor : 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: chartColors.tooltipBackgroundColor,
        textStyle: {
          color: chartColors.axisText,
        },
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['Atendida', 'Não Atendida'],
        textStyle: {
          color: chartColors.axisText,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: operadores.length > 10 ? 80 : 50,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: operadores,
        axisLine: {
          lineStyle: {
            color: chartColors.axisText,
          },
        },
        axisLabel: {
          color: chartColors.axisText,
          rotate: operadores.length > 10 ? 45 : 0,
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: chartColors.axisText,
          },
        },
        splitLine: {
          lineStyle: {
            color: chartColors.gridLineColor,
          },
        },
        axisLabel: {
          color: chartColors.axisText,
        },
      },
      series,
    });
  };

  const processarGraficoLinha = (dadosFiltrados) => {
    // Agrupar dados por data
    const callsPerDate = {};

    dadosFiltrados.forEach((item) => {
      const dataItem = format(new Date(item.data), 'yyyy-MM-dd');
      if (!callsPerDate[dataItem]) {
        callsPerDate[dataItem] = 0;
      }
      callsPerDate[dataItem] += 1;
    });

    const dates = Object.keys(callsPerDate).sort();
    const callsData = dates.map((date) => callsPerDate[date]);

    // Configuração do gráfico de linha
    setLineChartOption({
      backgroundColor:
        customization.backgroundType === 'color' ? customization.backgroundColor : 'transparent',
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          formatter: function (value) {
            return format(new Date(value), 'dd/MM');
          },
          color: chartColors.axisText,
        },
        axisLine: {
          lineStyle: {
            color: chartColors.axisText,
          },
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: chartColors.axisText,
        },
        axisLine: {
          lineStyle: {
            color: chartColors.axisText,
          },
        },
        splitLine: {
          lineStyle: {
            color: chartColors.gridLineColor,
          },
        },
      },
      series: [
        {
          name: 'Chamadas',
          data: callsData,
          type: 'line',
          smooth: true,
          areaStyle: {},
          itemStyle: {
            color: customization.chartColors.api4com,
          },
          lineStyle: {
            color: customization.chartColors.api4com,
          },
        },
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: chartColors.tooltipBackgroundColor,
        textStyle: {
          color: chartColors.axisText,
        },
      },
      legend: {
        data: ['Chamadas'],
        textStyle: {
          color: chartColors.axisText,
        },
      },
    });
  };

  // Estilo de fundo baseado nas personalizações
  const backgroundStyle =
    customization.backgroundType === 'color'
      ? { backgroundColor: customization.backgroundColor }
      : customization.backgroundType === 'gradient'
      ? {
          backgroundImage: `linear-gradient(to bottom, ${customization.backgroundGradient.from}, ${customization.backgroundGradient.to})`,
        }
      : customization.backgroundType === 'image'
      ? {
          backgroundImage: `url(${customization.backgroundImage})`,
          backgroundSize: 'cover',
        }
      : {};

      return (
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" color="primary" elevation={1}>
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={() => setIsDrawerOpen(true)}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Dashboard de Chamadas
              </Typography>
            </Toolbar>
          </AppBar>
          <Box
            sx={{
              p: 4,
              minHeight: '100vh',
              ...backgroundStyle,
            }}
          >
            <Grid container spacing={3}>
              {/* Filtros */}
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6} lg={4}>
                    {/* Filtro de Membros */}
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Membros</Typography>
                        <Autocomplete
                          multiple
                          options={membros}
                          value={membrosSelecionados}
                          onChange={(event, newValue) => setMembrosSelecionados(newValue)}
                          disableCloseOnSelect
                          getOptionLabel={(option) => option}
                          renderOption={(props, option, { selected }) => (
                            <li {...props}>
                              <Checkbox checked={selected} sx={{ mr: 1 }} />
                              {option}
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="outlined"
                              label="Membros"
                              size="small"
                            />
                          )}
                        />
                        <Box sx={{ mt: 1 }}>
                          <Button size="small" onClick={() => setMembrosSelecionados(membros)}>
                            Selecionar Todos
                          </Button>
                          <Button size="small" onClick={() => setMembrosSelecionados([])}>
                            Limpar Seleção
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6} lg={4}>
                    {/* Seletor de Intervalo de Datas */}
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Período</Typography>
                        <LocalizationProvider
                          dateAdapter={AdapterDateFns}
                          adapterLocale={ptBR}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DatePicker
                              label="Início"
                              value={startDate}
                              onChange={(newValue) => setStartDate(newValue)}
                              renderInput={(params) => (
                                <TextField {...params} variant="outlined" size="small" />
                              )}
                            />
                            <Box sx={{ mx: 2 }}> até </Box>
                            <DatePicker
                              label="Fim"
                              value={endDate}
                              onChange={(newValue) => setEndDate(newValue)}
                              renderInput={(params) => (
                                <TextField {...params} variant="outlined" size="small" />
                              )}
                            />
                          </Box>
                        </LocalizationProvider>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
              {/* KPIs */}
              <Grid item xs={12} md={6} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Total de Chamadas</Typography>
                    <Typography variant="h4">{chamadasPeriodoAtual}</Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: comparacaoPeriodo >= 0 ? 'green' : 'red' }}
                    >
                      {comparacaoPeriodo >= 0
                        ? `▲ ${comparacaoPeriodo}`
                        : `▼ ${Math.abs(comparacaoPeriodo)}`}{' '}
                      vs período anterior
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              {/* Gráfico Principal */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Chamadas por Membro e Plataforma</Typography>
                    {option ? (
                      <ReactECharts
                        option={option}
                        style={{
                          height: customization.mainChartHeight || '400px',
                          width: customization.mainChartWidth || '100%',
                        }}
                      />
                    ) : (
                      <div>Carregando...</div>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              {/* Gráfico Callix */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      Callix - Chamadas por Membro e Qualificação
                    </Typography>
                    {callixChartOption ? (
                      <ReactECharts
                        option={callixChartOption}
                        style={{
                          height: customization.callixChartHeight || '400px',
                          width: customization.callixChartWidth || '100%',
                        }}
                      />
                    ) : (
                      <div>Carregando...</div>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              {/* Gráfico API4COM */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      API4COM - Chamadas por Membro e Status
                    </Typography>
                    {api4comChartOption ? (
                      <ReactECharts
                        option={api4comChartOption}
                        style={{
                          height: customization.api4comChartHeight || '400px',
                          width: customization.api4comChartWidth || '100%',
                        }}
                      />
                    ) : (
                      <div>Carregando...</div>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              {/* Gráfico de Linha */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Chamadas ao Longo do Tempo</Typography>
                    {lineChartOption ? (
                      <ReactECharts
                        option={lineChartOption}
                        style={{
                          height: customization.lineChartHeight || '400px',
                          width: customization.lineChartWidth || '100%',
                        }}
                      />
                    ) : (
                      <div>Carregando...</div>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
      
          {/* Painel Lateral de Personalização */}
          <Drawer anchor="right" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
            <Box sx={{ width: 300 }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
              >
                <Tab label="Cores" />
                <Tab label="Layout" />
                <Tab label="Gráficos" />
              </Tabs>
      
              <TabPanel value={tabValue} index={0}>
                {/* Controles de cores */}
                <Typography variant="subtitle1">Cor API4COM</Typography>
                <ChromePicker
                  color={customization.chartColors.api4com}
                  onChangeComplete={(color) =>
                    setCustomization((prev) => ({
                      ...prev,
                      chartColors: {
                        ...prev.chartColors,
                        api4com: color.hex,
                      },
                    }))
                  }
                />
      
                <Typography variant="subtitle1">Cor CALLIX</Typography>
                <ChromePicker
                  color={customization.chartColors.callix}
                  onChangeComplete={(color) =>
                    setCustomization((prev) => ({
                      ...prev,
                      chartColors: {
                        ...prev.chartColors,
                        callix: color.hex,
                      },
                    }))
                  }
                />
      
                <Typography variant="subtitle1">Tipo de Fundo</Typography>
                <Select
                  fullWidth
                  value={customization.backgroundType}
                  onChange={(e) =>
                    setCustomization((prev) => ({ ...prev, backgroundType: e.target.value }))
                  }
                >
                  <MenuItem value="color">Cor Sólida</MenuItem>
                  <MenuItem value="gradient">Gradiente</MenuItem>
                  <MenuItem value="image">Imagem</MenuItem>
                </Select>
      
                {customization.backgroundType === 'color' && (
                  <>
                    <Typography variant="subtitle1">Cor de Fundo</Typography>
                    <ChromePicker
                      color={customization.backgroundColor}
                      onChangeComplete={(color) =>
                        setCustomization((prev) => ({
                          ...prev,
                          backgroundColor: color.hex,
                        }))
                      }
                    />
                  </>
                )}
      
                {customization.backgroundType === 'gradient' && (
                  <>
                    <Typography variant="subtitle1">Gradiente - Cor Inicial</Typography>
                    <ChromePicker
                      color={customization.backgroundGradient.from}
                      onChangeComplete={(color) =>
                        setCustomization((prev) => ({
                          ...prev,
                          backgroundGradient: {
                            ...prev.backgroundGradient,
                            from: color.hex,
                          },
                        }))
                      }
                    />
                    <Typography variant="subtitle1">Gradiente - Cor Final</Typography>
                    <ChromePicker
                      color={customization.backgroundGradient.to}
                      onChangeComplete={(color) =>
                        setCustomization((prev) => ({
                          ...prev,
                          backgroundGradient: {
                            ...prev.backgroundGradient,
                            to: color.hex,
                          },
                        }))
                      }
                    />
                  </>
                )}
      
                {customization.backgroundType === 'image' && (
                  <>
                    <Typography variant="subtitle1">URL da Imagem de Fundo</Typography>
                    <TextField
                      fullWidth
                      value={customization.backgroundImage}
                      onChange={(e) =>
                        setCustomization((prev) => ({
                          ...prev,
                          backgroundImage: e.target.value,
                        }))
                      }
                    />
                  </>
                )}
      
                {/* Accordion para cores das qualificações */}
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="qualificacoes-content"
                    id="qualificacoes-header"
                  >
                    <Typography variant="subtitle1">Cores das Qualificações (Callix)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {todasQualificacoes.map((qualificacao) => (
                      <Box key={qualificacao} sx={{ mb: 2 }}>
                        <Typography variant="body2">{qualificacao}</Typography>
                        <ChromePicker
                          color={customization.chartColors.qualificacoes[qualificacao]}
                          onChangeComplete={(color) =>
                            setCustomization((prev) => ({
                              ...prev,
                              chartColors: {
                                ...prev.chartColors,
                                qualificacoes: {
                                  ...prev.chartColors.qualificacoes,
                                  [qualificacao]: color.hex,
                                },
                              },
                            }))
                          }
                        />
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              </TabPanel>
      
              <TabPanel value={tabValue} index={1}>
                {/* Controles de layout */}
                <Typography variant="subtitle1">Altura do Gráfico Principal</Typography>
                <Slider
                  value={customization.mainChartHeight}
                  min={300}
                  max={800}
                  onChange={(event, newValue) =>
                    setCustomization((prev) => ({
                      ...prev,
                      mainChartHeight: newValue,
                    }))
                  }
                />
      
                <Typography variant="subtitle1">Largura do Gráfico Principal (%)</Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={parseInt(customization.mainChartWidth)}
                  onChange={(event) =>
                    setCustomization((prev) => ({
                      ...prev,
                      mainChartWidth: `${event.target.value}%`,
                    }))
                  }
                />
      
                {/* Você pode adicionar mais controles para outros gráficos */}
              </TabPanel>
      
              <TabPanel value={tabValue} index={2}>
                {/* Controles específicos dos gráficos */}
                <Typography variant="subtitle1">Qualificações do Callix</Typography>
                <Autocomplete
                  multiple
                  options={todasQualificacoes}
                  value={qualificacoesSelecionadas}
                  onChange={(event, newValue) => setQualificacoesSelecionadas(newValue)}
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox checked={selected} />
                      {option}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} variant="outlined" label="Qualificações" />
                  )}
                />
              </TabPanel>
            </Box>
          </Drawer>
        </Box>
      );
      
}

export default EChartsDashboard;
