package org.thomcgn.backend.pdf.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.geom.AffineTransform;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class PdfExportServiceV2 {

    // Layout
    private static final PDRectangle PAGE = PDRectangle.A4;
    private static final float MARGIN_LEFT = 50;
    private static final float MARGIN_RIGHT = 50;
    private static final float MARGIN_TOP = 60;
    private static final float MARGIN_BOTTOM = 60;

    private static final float HEADER_Y = PAGE.getHeight() - 40;
    private static final float FOOTER_Y = 30;

    private static final float TITLE_SIZE = 16f;
    private static final float H2_SIZE = 12f;
    private static final float BODY_SIZE = 10.5f;
    private static final float LINE_HEIGHT = 14f;

    public record PdfNote(
            String createdAt,
            String createdBy,
            String typ,
            String text
    ) {}

    public record PdfFallData(
            String aktenzeichen,         // optional
            String titel,
            String status,
            String traegerName,
            String einrichtungName,
            String teamName,
            String createdAt,
            String createdBy,
            String kurzbeschreibung,
            List<PdfNote> notizen
    ) {}

    public byte[] buildFallaktePdf(PdfFallData data, String watermarkText) {
        try (PDDocument doc = new PDDocument()) {
            PDType0Font fontRegular = loadFont(doc, "fonts/DejaVuSans.ttf");
            PDType0Font fontBold = loadFont(doc, "fonts/DejaVuSans.ttf"); // MVP: same file, we emulate "bold" via size/spacing
            // Optional: separate bold font file if you want real bold.

            RenderContext ctx = new RenderContext(doc, fontRegular, fontBold, watermarkText);
            ctx.newPage();

            // Header meta line
            String headerLeft = safe(data.traegerName) + " • " + safe(data.einrichtungName);
            String headerRight = safe(data.aktenzeichen != null ? data.aktenzeichen : "");

            // Title
            ctx.drawHeader(headerLeft, headerRight);
            ctx.drawTitle("Fallakte: " + safe(data.titel));

            // Meta block
            ctx.h2("Stammdaten");
            List<String> meta = new ArrayList<>();
            meta.add("Status: " + safe(data.status));
            if (data.teamName != null && !data.teamName.isBlank()) meta.add("Team: " + safe(data.teamName));
            meta.add("Erstellt am: " + safe(data.createdAt));
            meta.add("Erstellt von: " + safe(data.createdBy));
            if (data.aktenzeichen != null && !data.aktenzeichen.isBlank()) meta.add("Aktenzeichen: " + safe(data.aktenzeichen));
            ctx.bullets(meta);

            // Kurzbeschreibung
            ctx.h2("Kurzbeschreibung");
            ctx.paragraph(data.kurzbeschreibung != null ? data.kurzbeschreibung : "-");

            // Notizen
            ctx.h2("Notizen");
            if (data.notizen == null || data.notizen.isEmpty()) {
                ctx.paragraph("-");
            } else {
                for (PdfNote n : data.notizen) {
                    String head = "[" + safe(n.createdAt) + "] "
                            + (n.typ != null && !n.typ.isBlank() ? "(" + safe(n.typ) + ") " : "")
                            + safe(n.createdBy);
                    ctx.noteHeader(head);
                    ctx.paragraph(n.text != null ? n.text : "");
                    ctx.spacer(6);
                }
            }

            // After all pages created, add footer with page numbers (we already render footer per page)
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("PDF generation failed", e);
        }
    }

    // -------------------------
    // Internals
    // -------------------------

    private PDType0Font loadFont(PDDocument doc, String classpath) throws Exception {
        ClassPathResource res = new ClassPathResource(classpath);
        try (InputStream in = res.getInputStream()) {
            return PDType0Font.load(doc, in, true);
        }
    }

    private String safe(String s) {
        if (s == null) return "";
        return s.replace("\r", " ").replace("\n", " ");
    }

    private static class RenderContext {
        final PDDocument doc;
        final PDType0Font font;
        final PDType0Font fontBold;
        final String watermarkText;

        PDPage page;
        PDPageContentStream cs;
        float y;
        int pageNo = 0;

        RenderContext(PDDocument doc, PDType0Font font, PDType0Font fontBold, String watermarkText) {
            this.doc = doc;
            this.font = font;
            this.fontBold = fontBold;
            this.watermarkText = watermarkText;
        }

        void newPage() throws Exception {
            closeStreamIfOpen();

            page = new PDPage(PAGE);
            doc.addPage(page);
            pageNo++;

            cs = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true, true);

            // watermark first (behind content)
            if (watermarkText != null && !watermarkText.isBlank()) {
                drawWatermark(watermarkText);
            }

            // header/footer
            drawFooter(); // includes page no (simple)
            y = PAGE.getHeight() - MARGIN_TOP;
        }

        void closeStreamIfOpen() {
            try {
                if (cs != null) cs.close();
            } catch (Exception ignored) {}
        }

        void ensureSpace(float needed) throws Exception {
            if (y - needed < MARGIN_BOTTOM) {
                newPage();
            }
        }

        void drawHeader(String left, String right) throws Exception {
            // header line
            cs.setFont(font, 9f);
            float yHeader = HEADER_Y;

            // left
            cs.beginText();
            cs.newLineAtOffset(MARGIN_LEFT, yHeader);
            cs.showText(left);
            cs.endText();

            // right aligned
            if (right != null && !right.isBlank()) {
                float textWidth = width(font, 9f, right);
                cs.beginText();
                cs.newLineAtOffset(PAGE.getWidth() - MARGIN_RIGHT - textWidth, yHeader);
                cs.showText(right);
                cs.endText();
            }

            // divider
            cs.moveTo(MARGIN_LEFT, yHeader - 8);
            cs.lineTo(PAGE.getWidth() - MARGIN_RIGHT, yHeader - 8);
            cs.stroke();
        }

        void drawFooter() throws Exception {
            cs.setFont(font, 9f);
            String footer = "Seite " + pageNo;

            float w = width(font, 9f, footer);
            cs.beginText();
            cs.newLineAtOffset(PAGE.getWidth() - MARGIN_RIGHT - w, FOOTER_Y);
            cs.showText(footer);
            cs.endText();

            // small divider
            cs.moveTo(MARGIN_LEFT, FOOTER_Y + 10);
            cs.lineTo(PAGE.getWidth() - MARGIN_RIGHT, FOOTER_Y + 10);
            cs.stroke();
        }

        void drawTitle(String title) throws Exception {
            ensureSpace(30);
            cs.setFont(fontBold, TITLE_SIZE);
            writeWrapped(title, TITLE_SIZE, 2);
            spacer(6);
        }

        void h2(String text) throws Exception {
            spacer(8);
            ensureSpace(24);
            cs.setFont(fontBold, H2_SIZE);
            writeWrapped(text, H2_SIZE, 0);
            spacer(2);
            // underline
            cs.moveTo(MARGIN_LEFT, y + 6);
            cs.lineTo(PAGE.getWidth() - MARGIN_RIGHT, y + 6);
            cs.stroke();
            spacer(6);
        }

        void bullets(List<String> items) throws Exception {
            for (String it : items) {
                ensureSpace(LINE_HEIGHT * 2);
                cs.setFont(font, BODY_SIZE);

                // bullet
                float bulletX = MARGIN_LEFT;
                float textX = MARGIN_LEFT + 12;
                cs.beginText();
                cs.newLineAtOffset(bulletX, y);
                cs.showText("•");
                cs.endText();

                writeWrappedAt(it, BODY_SIZE, textX, 0);
                spacer(2);
            }
        }

        void paragraph(String text) throws Exception {
            ensureSpace(LINE_HEIGHT * 2);
            cs.setFont(font, BODY_SIZE);
            writeWrapped(text, BODY_SIZE, 0);
        }

        void noteHeader(String text) throws Exception {
            ensureSpace(LINE_HEIGHT * 2);
            cs.setFont(fontBold, BODY_SIZE);
            writeWrapped(text, BODY_SIZE, 0);
            spacer(2);
        }

        void spacer(float px) {
            y -= px;
        }

        // ---- text wrapping helpers ----

        void writeWrapped(String text, float fontSize, int extraGapLines) throws Exception {
            writeWrappedAt(text, fontSize, MARGIN_LEFT, extraGapLines);
        }

        void writeWrappedAt(String text, float fontSize, float x, int extraGapLines) throws Exception {
            if (text == null) text = "";
            float maxWidth = PAGE.getWidth() - MARGIN_RIGHT - x;

            List<String> lines = wrap(text, font, fontSize, maxWidth);
            for (String line : lines) {
                ensureSpace(LINE_HEIGHT);
                cs.beginText();
                cs.newLineAtOffset(x, y);
                cs.showText(line);
                cs.endText();
                y -= LINE_HEIGHT;
            }
            y -= extraGapLines * LINE_HEIGHT;
        }

        static List<String> wrap(String text, PDFont font, float fontSize, float maxWidth) throws Exception {
            List<String> out = new ArrayList<>();
            String normalized = text.replace("\r", "").replace("\t", "  ");
            String[] paragraphs = normalized.split("\n");

            for (String p : paragraphs) {
                if (p.isBlank()) {
                    out.add("");
                    continue;
                }

                String[] words = p.split(" ");
                StringBuilder line = new StringBuilder();

                for (String w : words) {
                    if (w.isEmpty()) continue;

                    String candidate = line.length() == 0 ? w : (line + " " + w);
                    float width = width(font, fontSize, candidate);

                    if (width <= maxWidth) {
                        line.setLength(0);
                        line.append(candidate);
                    } else {
                        if (!line.isEmpty()) out.add(line.toString());
                        // if single word too long -> hard split
                        if (width(font, fontSize, w) > maxWidth) {
                            out.addAll(hardSplit(w, font, fontSize, maxWidth));
                            line.setLength(0);
                        } else {
                            line.setLength(0);
                            line.append(w);
                        }
                    }
                }
                if (line.length() > 0) out.add(line.toString());
            }
            return out;
        }

        static List<String> hardSplit(String word, PDFont font, float fontSize, float maxWidth) throws Exception {
            List<String> parts = new ArrayList<>();
            StringBuilder current = new StringBuilder();
            for (int i = 0; i < word.length(); i++) {
                char c = word.charAt(i);
                String candidate = current.toString() + c;
                if (width(font, fontSize, candidate) <= maxWidth) {
                    current.append(c);
                } else {
                    if (!current.isEmpty()) parts.add(current.toString());
                    current.setLength(0);
                    current.append(c);
                }
            }
            if (!current.isEmpty()) parts.add(current.toString());
            return parts;
        }

        void drawWatermark(String text) throws Exception {
            // semi-transparent diagonal watermark
            PDExtendedGraphicsState gs = new PDExtendedGraphicsState();
            gs.setNonStrokingAlphaConstant(0.12f);
            gs.setStrokingAlphaConstant(0.12f);
            cs.setGraphicsStateParameters(gs);

            cs.saveGraphicsState();

            // rotate around center
            float centerX = PAGE.getWidth() / 2f;
            float centerY = PAGE.getHeight() / 2f;

            AffineTransform at = new AffineTransform();
            at.translate(centerX, centerY);
            at.rotate(Math.toRadians(35));
            at.translate(-centerX, -centerY);
            cs.transform(new org.apache.pdfbox.util.Matrix(at));

            cs.setFont(fontBold, 46f);
            float textWidth = width(fontBold, 46f, text);

            cs.beginText();
            cs.newLineAtOffset(centerX - (textWidth / 2f), centerY);
            cs.showText(text);
            cs.endText();

            cs.restoreGraphicsState();

            // reset alpha to 1 for normal content
            PDExtendedGraphicsState gs2 = new PDExtendedGraphicsState();
            gs2.setNonStrokingAlphaConstant(1f);
            gs2.setStrokingAlphaConstant(1f);
            cs.setGraphicsStateParameters(gs2);
        }

        static float width(PDFont font, float fontSize, String text) throws Exception {
            return (font.getStringWidth(text) / 1000f) * fontSize;
        }
    }

    private static float width(PDFont font, float fontSize, String text) throws Exception {
        return (font.getStringWidth(text) / 1000f) * fontSize;
    }
}