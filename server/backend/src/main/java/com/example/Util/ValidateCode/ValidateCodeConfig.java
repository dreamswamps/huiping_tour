package com.example.Util.ValidateCode;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ValidateCodeConfig {
    private int CodeNumber = 4;
    private int ImageHeight = 40;
    private int ImageWidth = 160;
    private int LineCount = 10;
    private int PointCount = 20;
    private int FontBaseSize = 20;
    private int FontRange = 10;
}
