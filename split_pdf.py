import os
from pypdf import PdfReader, PdfWriter

def split_pdf(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    try:
        reader = PdfReader(file_path)
        total_pages = len(reader.pages)
        print(f"Total pages: {total_pages}")

        # Define split ranges (start_index, count)
        # Part 1: 30 pages (0-29)
        # Part 2: 30 pages (30-59)
        # Part 3: Remaining (60-end)
        
        parts = [
            (0, 30, "part1.pdf"),
            (30, 60, "part2.pdf"),
            (60, total_pages, "part3.pdf")
        ]

        for start, end, output_name in parts:
            if start >= total_pages:
                print(f"Skipping {output_name} (start index {start} >= total pages {total_pages})")
                continue
            
            # Adjust end if it exceeds total pages
            actual_end = min(end, total_pages)
            
            if start >= actual_end:
                 print(f"Skipping {output_name} (empty range {start}-{actual_end})")
                 continue

            writer = PdfWriter()
            for i in range(start, actual_end):
                writer.add_page(reader.pages[i])
            
            output_path = os.path.join(os.path.dirname(file_path), output_name)
            with open(output_path, "wb") as f:
                writer.write(f)
            print(f"Created {output_name} with {actual_end - start} pages")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    file_path = r"d:\code\TraeChat\pdfSplit\扫描件_2026020911.pdf"
    split_pdf(file_path)
