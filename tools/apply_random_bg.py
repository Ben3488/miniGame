import os
import glob

def main():
    games_dir = r"e:\Project\10. AI_tool\miniGame\games"
    html_files = glob.glob(os.path.join(games_dir, "*.html"))
    
    script_tag = '\n    <script src="../assets/common/random_bg.js"></script>\n'
    
    for file_path in html_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if "random_bg.js" in content:
            print(f"Skipping {os.path.basename(file_path)}, already applied.")
            continue
            
        # Insert before </body>
        if "</body>" in content:
            content = content.replace("</body>", script_tag + "</body>")
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Applied to {os.path.basename(file_path)}")
        else:
            print(f"Could not find </body> in {os.path.basename(file_path)}")

if __name__ == "__main__":
    main()
