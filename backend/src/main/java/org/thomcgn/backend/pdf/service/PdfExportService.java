package org.thomcgn.backend.pdf;

import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
public class PdfExportService {

    public byte[] buildFallPdf(String title, List<String> lines) {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.setFont(PDType1Font.HELVETICA_BOLD, 14);
                cs.beginText();
                cs.newLineAtOffset(50, 800);
                cs.showText(title);
                cs.endText();

                cs.setFont(PDType1Font.HELVETICA, 10);
                float y = 780;

                for (String line : lines) {
                    if (y < 60) {
                        cs.close();
                        page = new PDPage(PDRectangle.A4);
                        doc.addPage(page);
                        y = 800;
                        // new content stream for new page
                        try (PDPageContentStream cs2 = new PDPageContentStream(doc, page)) {
                            y = writeLines(cs2, y, lines.subList(lines.indexOf(line), lines.size()));
                        }
                        break;
                    }
                    cs.beginText();
                    cs.newLineAtOffset(50, y);
                    cs.showText(safe(line));
                    cs.endText();
                    y -= 14;
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("PDF generation failed", e);
        }
    }

    private float writeLines(PDPageContentStream cs, float y, List<String> remaining) throws Exception {
        cs.setFont(PDType1Font.HELVETICA, 10);
        for (String line : remaining) {
            if (y < 60) break;
            cs.beginText();
            cs.newLineAtOffset(50, y);
            cs.showText(safe(line));
            cs.endText();
            y -= 14;
        }
        return y;
    }

    private String safe(String s) {
        if (s == null) return "";
        // PDFBox Type1Font supports WinAnsi; keep it simple for MVP
        return s.replace("\n", " ").replace("\r", " ");
    }
}