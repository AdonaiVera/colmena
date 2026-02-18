import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";

import { triggerStyle, dropdownStyle, labelStyle, itemStyle } from "../lib/dialog-styles";

interface BranchPickerProps {
  branches: string[];
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
}

const NEW_BRANCH_VALUE = "__new__";

export function BranchPicker({ branches, selectedBranch, onSelectBranch }: BranchPickerProps) {
  return (
    <div style={{ padding: "0 28px 20px" }}>
      <Label style={labelStyle}>Branch</Label>
      <Select value={selectedBranch} onValueChange={onSelectBranch}>
        <SelectTrigger style={triggerStyle}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          position="popper"
          style={{ ...dropdownStyle, minWidth: 240, maxHeight: 260 }}
        >
          <SelectItem value={NEW_BRANCH_VALUE} style={itemStyle}>
            <span style={{ color: "var(--accent)", fontSize: 13 }}>Create new branch</span>
          </SelectItem>
          {branches.map((b) => (
            <SelectItem key={b} value={b} style={itemStyle}>
              <span style={{ color: "var(--text)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                {b}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { NEW_BRANCH_VALUE };
