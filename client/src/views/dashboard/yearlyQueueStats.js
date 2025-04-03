import React, { useEffect, useRef, useState } from 'react'
import { CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
import axios from '../../utils/axiosInstance' // Assumes axiosInstance is set up with base URL and interceptors

const YearlyQueueStats = () => {
  const chartRef = useRef(null)
  const [loadStats, setLoadStats] = useState(Array(12).fill(0)) // Data for 'Aylik Yüklenmiş Dosyalar'
  const [processStats, setProcessStats] = useState(Array(12).fill(0)) // Data for 'Aylık İşlenmiş Dosyalar'
  const [errorStats, setErrorStats] = useState(Array(12).fill(0)) // Data for 'Hata vermiş dosyalar'
  const specificYear = new Date().getFullYear() // Get current year

  // Fetch the data for the three datasets
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken') // Retrieve token from localStorage
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      try {
        const [loadRes, processRes, errorRes] = await Promise.all([
          axios.get(
            `/statistic/yearlyQueueLoadStats?specificYear=${specificYear}&specificQueue=Acil`,
            { headers },
          ),
          axios.get(
            `/statistic/yearlyQueueProcessStats?specificYear=${specificYear}&specificQueue=Acil`,
            { headers },
          ),
          axios.get(
            `/statistic/yearlyQueueErrorsStats?specificYear=${specificYear}&specificQueue=Acil`,
            { headers },
          ),
        ])

        // Map the data for each month, or default to 0 if data is missing for a month
        const mapMonthlyData = (data) => {
          const monthlyData = Array(12).fill(0)
          data.forEach((item) => {
            monthlyData[item._id.month - 1] = item.count
          })
          return monthlyData
        }

        setLoadStats(mapMonthlyData(loadRes.data))
        setProcessStats(mapMonthlyData(processRes.data))
        setErrorStats(mapMonthlyData(errorRes.data))
      } catch (error) {
        console.error('Error fetching chart data:', error.response?.data || error.message)
      }
    }

    fetchData()

    // Handle theme changes dynamically
    document.documentElement.addEventListener('ColorSchemeChange', () => {
      if (chartRef.current) {
        setTimeout(() => {
          chartRef.current.options.scales.x.grid.borderColor = getStyle(
            '--cui-border-color-translucent',
          )
          chartRef.current.options.scales.x.grid.color = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.x.ticks.color = getStyle('--cui-body-color')
          chartRef.current.options.scales.y.grid.borderColor = getStyle(
            '--cui-border-color-translucent',
          )
          chartRef.current.options.scales.y.grid.color = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.y.ticks.color = getStyle('--cui-body-color')
          chartRef.current.update()
        })
      }
    })
  }, [chartRef])

  return (
    <CChartLine
      ref={chartRef}
      style={{ height: '300px', marginTop: '40px' }}
      data={{
        labels: [
          'Ocak',
          'Şubat',
          'Mart',
          'Nisan',
          'Mayıs',
          'Haziran',
          'Temmuz',
          'Ağustos',
          'Eylül',
          'Ekim',
          'Kasım',
          'Aralık',
        ],
        datasets: [
          {
            label: 'Aylik Yüklenmiş Dosyalar',
            backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
            borderColor: getStyle('--cui-info'),
            pointHoverBackgroundColor: getStyle('--cui-info'),
            borderWidth: 2,
            data: loadStats,
            fill: true,
          },
          {
            label: 'Aylık İşlenmiş Dosyalar',
            backgroundColor: 'transparent',
            borderColor: getStyle('--cui-success'),
            pointHoverBackgroundColor: getStyle('--cui-success'),
            borderWidth: 2,
            data: processStats,
          },
          {
            label: 'Hata vermiş dosyalar',
            backgroundColor: 'transparent',
            borderColor: getStyle('--cui-danger'),
            pointHoverBackgroundColor: getStyle('--cui-danger'),
            borderWidth: 1,
            borderDash: [8, 5],
            data: errorStats,
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: {
              color: getStyle('--cui-border-color-translucent'),
              drawOnChartArea: false,
            },
            ticks: { color: getStyle('--cui-body-color') },
          },
          y: {
            beginAtZero: true,
            border: { color: getStyle('--cui-border-color-translucent') },
            grid: { color: getStyle('--cui-border-color-translucent') },
            max: 250,
            ticks: {
              color: getStyle('--cui-body-color'),
              maxTicksLimit: 5,
              stepSize: Math.ceil(250 / 5),
            },
          },
        },
        elements: {
          line: { tension: 0.4 },
          point: {
            radius: 0,
            hitRadius: 10,
            hoverRadius: 4,
            hoverBorderWidth: 3,
          },
        },
      }}
    />
  )
}

export default YearlyQueueStats
