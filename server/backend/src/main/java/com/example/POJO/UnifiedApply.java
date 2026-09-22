package com.example.POJO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UnifiedApply {
    private int tid;
    private String type;
    private String templateName;
    private String templateDesc;
    private String permission;
    private boolean disabled;
}
