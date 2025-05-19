useEffect(() => {
    const fetchData = async () => {
        try {
            // Prepare os parâmetros de data no formato que o seu backend espera
            const params = {};
            if (startDate) params.start = format(startDate, 'yyyy-MM-dd');
            if (endDate) params.end = format(endDate, 'yyyy-MM-dd');

            const response = await axios.get(
                'https://…/api/chamadas', {
                    params
                }
            );
            const dados = response.data;

            // Extrair membros, qualificações, cores etc, igual antes:
            const operadores = [
                ...new Set(dados.map(i => (i.operador || '').split(' ')[0]).filter(Boolean))
            ];
            setMembros(operadores);
            setMembrosSelecionados(operadores);
            setData(dados);

            const qualificacoes = [
                ...new Set(
                    dados.filter(i => i.plataforma === 'callix')
                    .map(i => i.qualificacao || 'Não Informado')
                )
            ];
            setTodasQualificacoes(qualificacoes);

            // Inicializa cores das qualificações se precisar…
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
}, [startDate, endDate]);

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