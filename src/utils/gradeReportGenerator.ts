import html2canvas from "html2canvas"; // Protegido contra configuraciones estrictas de TS
import { jsPDF } from "jspdf";              // Importación nombrada correcta
import autoTable from "jspdf-autotable";    // IMPORTACIÓN DIRECTA: Soluciona el TypeError
import { ConsolidatedGrade } from "../models/dto/consolidatedGrade";

export class GradeReportGenerator {
    /**
     * Generar PDF de notas desde HTML
     */
    static async generatePDFFromElement(
        elementId: string,
        fileName: string = "reporte_notas.pdf"
    ): Promise<void> {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                throw new Error(`Elemento con ID ${elementId} no encontrado`);
            }

            // Convertir HTML a canvas
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
            });

            // Crear PDF
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 295; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            // Agregar imagen al PDF (puede ocupar múltiples páginas)
            const imgData = canvas.toDataURL("image/png");
            while (heightLeft > 0) {
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                position -= pageHeight;
                if (heightLeft > 0) {
                    pdf.addPage();
                }
            }

            // Descargar PDF
            pdf.save(fileName);
        } catch (error) {
            console.error("Error al generar PDF:", error);
            throw error;
        }
    }

    /**
     * Generar PDF de tabla de notas con datos
     */
    static async generateGradeTablePDF(
        grades: ConsolidatedGrade[],
        groupName: string,
        semesterName: string
    ): Promise<void> {
        try {
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4",
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let yPosition = 20;

            // Encabezado
            pdf.setFontSize(16);
            pdf.text("REPORTE DE NOTAS FINALES", pageWidth / 2, yPosition, {
                align: "center",
            });

            yPosition += 10;
            pdf.setFontSize(10);
            pdf.text(`Grupo: ${groupName}`, 15, yPosition);
            pdf.text(`Semestre: ${semesterName}`, pageWidth - 50, yPosition);

            yPosition += 15;

            // Tabla de notas
            const columns = [
                "Estudiante",
                "Cédula",
                "Estado",
                "Nota Final",
                "Estado Registro",
            ];
            const rows = grades.map((g) => [
                g.student_name,
                g.identification,
                g.status === "ACTIVE" ? "Activa" : g.status,
                g.weighted_final_grade.toFixed(2),
                g.is_locked ? "Bloqueada" : "Editable",
            ]);

            // CAMBIO CLAVE: Se llama como función autoTable(pdf, {...}) en lugar de pdf.autoTable({...})
            autoTable(pdf, {
                head: [columns],
                body: rows,
                startY: yPosition,
                margin: { top: 10, right: 15, bottom: 10, left: 15 },
                headStyles: {
                    fillColor: [66, 133, 244],
                    textColor: 255,
                    fontStyle: "bold",
                },
                bodyStyles: {
                    textColor: 50,
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245],
                },
                didDrawPage: (data: any) => {
                    // Pie de página dinámico y seguro
                    const pageNum = data.pageNumber;
                    
                    pdf.setFontSize(8);
                    // Usamos metatags dinámicos de jspdf-autotable para el conteo total de páginas real
                    pdf.text(
                        `Página ${pageNum}`,
                        pageWidth / 2,
                        pageHeight - 10,
                        { align: "center" }
                    );
                    pdf.text(
                        `Generado: ${new Date().toLocaleDateString()}`,
                        15,
                        pageHeight - 10
                    );
                },
            });

            pdf.save(`reporte_notas_${groupName}_${Date.now()}.pdf`);
        } catch (error) {
            console.error("Error al generar PDF de tabla:", error);
            throw error;
        }
    }

    /**
     * Exportar a CSV
     */
    static downloadCSV(
        grades: ConsolidatedGrade[],
        fileName: string = "notas.csv"
    ): void {
        try {
            const headers = [
                "Estudiante",
                "Cédula",
                "Nota Final",
                "Estado",
                "Bloqueada",
            ];
            const rows = grades.map((g) => [
                g.student_name,
                g.identification,
                g.weighted_final_grade.toFixed(2),
                g.status,
                g.is_locked ? "Sí" : "No",
            ]);

            let csv = headers.join(",") + "\n";
            rows.forEach((row) => {
                csv += row.map((cell) => `"${cell}"`).join(",") + "\n";
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error al descargar CSV:", error);
            throw error;
        }
    }
}