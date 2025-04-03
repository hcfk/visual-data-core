import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import axios from '../../utils/axiosInstance' // Import the axios instance
import { CRow, CCol, CWidgetStatsA } from '@coreui/react'
import { getStyle } from '@coreui/utils'
import { CChartLine } from '@coreui/react-chartjs'

// Fixed weekly labels
const WEEKLY_LABELS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

// Helper function to get the Monday of the current week
const getMondayOfCurrentWeek = () => {
  const today = new Date()
  const dayOfWeek = today.getDay() || 7 // Adjust Sunday from 0 to 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek + 1)
  return monday
}

const QueueToBeProcessed = (props) => {
  const [todayStats, setTodayStats] = useState({
    acil: 0,
    normal: 0,
    uzun: 0,
    total: 0,
  })
  const [weeklyStats, setWeeklyStats] = useState({
    acil: Array(7).fill(0),
    normal: Array(7).fill(0),
    uzun: Array(7).fill(0),
  })

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const weekDates = []
        const monday = getMondayOfCurrentWeek()
        const todayIndex = new Date().getDay() || 7 // Adjust Sunday to 7

        // Populate weekDates from Monday to today
        for (let i = 0; i < todayIndex; i++) {
          const date = new Date(monday)
          date.setDate(monday.getDate() + i)
          weekDates.push(date.toISOString().split('T')[0]) // Format YYYY-MM-DD
        }

        const acilWeekly = Array(7).fill(0)
        const normalWeekly = Array(7).fill(0)
        const uzunWeekly = Array(7).fill(0)

        // Fetch data for each date and queue up to today
        for (const [index, date] of weekDates.entries()) {
          const acilResponse = await axios.get(
            `/statistic/filesNotProcessed?specificDay=${date}&specificQueue=1`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          )
          const normalResponse = await axios.get(
            `/statistic/filesNotProcessed?specificDay=${date}&specificQueue=2`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          )
          const uzunResponse = await axios.get(
            `/statistic/filesNotProcessed?specificDay=${date}&specificQueue=3`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          )

          // Update weekly counts
          acilWeekly[index] = acilResponse.data.count || 0
          normalWeekly[index] = normalResponse.data.count || 0
          uzunWeekly[index] = uzunResponse.data.count || 0

          // Set today's stats when processing today's date
          if (index === todayIndex - 1) {
            setTodayStats({
              acil: acilWeekly[index],
              normal: normalWeekly[index],
              uzun: uzunWeekly[index],
              total: acilWeekly[index] + normalWeekly[index] + uzunWeekly[index],
            })
          }
        }

        // Update weekly stats
        setWeeklyStats({
          acil: acilWeekly,
          normal: normalWeekly,
          uzun: uzunWeekly,
        })
      } catch (error) {
        console.error('Error fetching queue stats:', error.response?.data || error.message)
      }
    }

    fetchWeeklyStats()
  }, [])

  return (
    <CRow className={props.className} xs={{ gutter: 4 }}>
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsA
          color="primary"
          value={<>{todayStats.acil} Dosya</>}
          title="Acil Sırasındaki Dosyalar"
          chart={
            <CChartLine
              className="mt-3 mx-3"
              style={{ height: '70px' }}
              data={{
                labels: WEEKLY_LABELS,
                datasets: [
                  {
                    label: 'Acil Weekly Statistics',
                    backgroundColor: 'transparent',
                    borderColor: 'rgba(255,255,255,.55)',
                    pointBackgroundColor: getStyle('--cui-primary'),
                    data: weeklyStats.acil,
                  },
                ],
              }}
              options={{
                plugins: { legend: { display: false } },
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { display: false }, ticks: { display: false } },
                  y: { min: 0, max: Math.max(0, ...weeklyStats.acil) + 10, display: false },
                },
                elements: {
                  line: { borderWidth: 1, tension: 0.4 },
                  point: { radius: 4, hitRadius: 10, hoverRadius: 4 },
                },
              }}
            />
          }
        />
      </CCol>

      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsA
          color="info"
          value={<>{todayStats.normal} Dosya</>}
          title="Normal Sırasındaki Dosyalar"
          chart={
            <CChartLine
              className="mt-3 mx-3"
              style={{ height: '70px' }}
              data={{
                labels: WEEKLY_LABELS,
                datasets: [
                  {
                    label: 'Normal Weekly Statistics',
                    backgroundColor: 'transparent',
                    borderColor: 'rgba(255,255,255,.55)',
                    pointBackgroundColor: getStyle('--cui-info'),
                    data: weeklyStats.normal,
                  },
                ],
              }}
              options={{
                plugins: { legend: { display: false } },
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { display: false }, ticks: { display: false } },
                  y: { min: 0, max: Math.max(0, ...weeklyStats.normal) + 10, display: false },
                },
                elements: {
                  line: { borderWidth: 1, tension: 0.4 },
                  point: { radius: 4, hitRadius: 10, hoverRadius: 4 },
                },
              }}
            />
          }
        />
      </CCol>

      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsA
          color="warning"
          value={<>{todayStats.uzun} Dosya</>}
          title="Uzun Sırasındaki Dosyalar"
          chart={
            <CChartLine
              className="mt-3 mx-3"
              style={{ height: '70px' }}
              data={{
                labels: WEEKLY_LABELS,
                datasets: [
                  {
                    label: 'Uzun Weekly Statistics',
                    backgroundColor: 'transparent',
                    borderColor: 'rgba(255,255,255,.55)',
                    pointBackgroundColor: getStyle('--cui-warning'),
                    data: weeklyStats.uzun,
                  },
                ],
              }}
              options={{
                plugins: { legend: { display: false } },
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { display: false }, ticks: { display: false } },
                  y: { min: 0, max: Math.max(0, ...weeklyStats.uzun) + 10, display: false },
                },
                elements: {
                  line: { borderWidth: 1, tension: 0.4 },
                  point: { radius: 4, hitRadius: 10, hoverRadius: 4 },
                },
              }}
            />
          }
        />
      </CCol>

      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsA
          color="danger"
          value={<>{todayStats.total} Toplam Dosya</>}
          title="Tüm Sıralardaki Dosyalar"
        />
      </CCol>
    </CRow>
  )
}

QueueToBeProcessed.propTypes = {
  className: PropTypes.string,
}

export default QueueToBeProcessed
