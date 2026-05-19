'use client'

import { jsPDF as JsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import backgroundImageUrl from '../asset/watermark-abc.png'

const loadImageAsBase64 = async (url: string) => {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

export const exportChartPDF = async (fileName: string) => {
  const backgroundImageBase64 = await loadImageAsBase64(backgroundImageUrl.src)

  const chartContainer = document.getElementById('chart-pdf-export-container')
  if (chartContainer) {
    html2canvas(chartContainer).then((canvas) => {
      const imgData = canvas.toDataURL('image/png')
      const pdf = new JsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 20 // Margem superior

      pdf.addImage(backgroundImageBase64, 'PNG', 0, 0, imgWidth, pageHeight)
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight - position)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${fileName}.pdf`)
    })
  }
}
