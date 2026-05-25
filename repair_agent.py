with open('App.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if '<aside className={`saas-sidebar-panel' in line:
        new_lines.append(line)
        new_lines.append('                  <Agent\n')
        new_lines.append('                    sheetData={currentSheetData}\n')
        new_lines.append('                    workbook={workbook}\n')
        new_lines.append('                    onAddToDashboard={addToDashboard}\n')
        new_lines.append('                    onUpdateData={pushToHistory}\n')
        new_lines.append('                    onUpdateWorkbook={(wb) => setWorkbook(wb)}\n')
        new_lines.append('                    onSwitchSheet={handleActiveSheetChange}\n')
        new_lines.append('                    promptOverride={agentPromptOverride}\n')
        new_lines.append('                    onClearPromptOverride={() => setAgentPromptOverride(null)}\n')
        new_lines.append('                  />\n')
        skip = True
        continue
    if skip:
        if '</aside>' in line:
            new_lines.append(line)
            skip = False
        continue
    new_lines.append(line)

with open('App.tsx', 'w') as f:
    f.writelines(new_lines)
