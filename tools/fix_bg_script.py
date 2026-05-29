import os
import glob

def main():
    games_dir = r"e:\Project\10. AI_tool\miniGame\games"
    html_files = glob.glob(os.path.join(games_dir, "*.html"))
    
    old_script_tag = '<script src="../assets/common/random_bg.js"></script>'
    new_script_tag = '<script src="../assets/SanGuoSha/backgrounds/random_bg.js"></script>'
    
    for file_path in html_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        modified = False
        
        # Remove old script from everywhere
        if old_script_tag in content:
            content = content.replace(old_script_tag, "")
            modified = True
            
        # Add new script only to SanGuoSha games
        if "SanGuoSha" in os.path.basename(file_path):
            if new_script_tag not in content:
                content = content.replace("</body>", f"    {new_script_tag}\n</body>")
                modified = True
                
        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                # To clean up empty lines caused by removal
                clean_content = content.replace("\n    \n</body>", "\n</body>").replace("\n\n</body>", "\n</body>")
                f.write(clean_content)
            print(f"Updated {os.path.basename(file_path)}")

if __name__ == "__main__":
    main()
