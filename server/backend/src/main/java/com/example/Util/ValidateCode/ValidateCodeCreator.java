package com.example.Util.ValidateCode;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.util.Random;

@Component
public class ValidateCodeCreator {
    /*
    =====验证码生成器=====
     */
    private static final Random RANDOM = new Random();

//    该字符池有三种字母被删除：I,O,Q
    private static final char[] CHAR_POOL =
            "0123456789abcdefghjklmnprstuvwxyzABCDEFGHJKLMNPRSTUVWXYZ".toCharArray();
//    提供一个默认配置
    private final ValidateCodeConfig DefaultConfig = new ValidateCodeConfig();
    /*
    =====公共方法=====
     */

//    无参默认
    public CodeImageResult generate(){
        return createCodeImage(DefaultConfig);
    }

//    有参完整对象，未经修改的属性仍为默认值
    public CodeImageResult generate(ValidateCodeConfig config){
        return createCodeImage(config);
    }

//    将无效值设置为默认值

    /*
    =====内部绘图方法=====
     */
    //    随机生成指定位数的验证码
    private StringBuilder randomCode(ValidateCodeConfig config) {
        char[] chars = CHAR_POOL;
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < config.getCodeNumber(); i++) {
            code.append(chars[RANDOM.nextInt(chars.length)]);
        }
        return code;
    }

    //    随机生成指定范围内的颜色
    private Color randomColor(int color_min, int color_max) {
        int range = Math.min(255,Math.max(0,color_max-color_min)) ;
        return new Color(color_min + RANDOM.nextInt(range),
                color_min + RANDOM.nextInt(range),
                color_min + RANDOM.nextInt(range));
    }

    //    绘制背景颜色
    private void drawBackground(Graphics2D g, ValidateCodeConfig config) {
//        选择画笔颜色
        g.setColor(randomColor(200,255));
//        选择从0,0坐标即左上角开始绘制和画布相同大小的矩形，即背景色
        g.fillRect(0, 0, config.getImageWidth(), config.getImageHeight());
    }

    //    绘制验证码文字
    private void drawCode(StringBuilder code, Graphics2D g, ValidateCodeConfig config) {
//        一个用于保存经过变化矩阵处理的数学矩阵
        AffineTransform originalTransform = g.getTransform();
        for (int i = 0; i < config.getCodeNumber(); i++) {
//            移动画笔至目标地点
            g.translate(i * (config.getImageWidth() / config.getCodeNumber()) + RANDOM.nextInt(6) + 4,
                    config.getImageHeight()/2 +RANDOM.nextInt(10) +2);
//            随机旋转±30°
            g.rotate(Math.toRadians(RANDOM.nextInt(61)-30));
            g.setColor(randomColor(50,150));
            Font font = new Font("Times New Roman", Font.BOLD,
                    config.getFontBaseSize() + RANDOM.nextInt(config.getFontRange()));
            g.setFont(font);
//            由于已经位于目标点，所以不需要xy轴偏移
            g.drawString(code.substring(i,i+1), 0,0);
//            恢复至保存点
            g.setTransform(originalTransform);
        }
    }

    //    绘制干扰元素
    private void drawInterference(Graphics2D g, ValidateCodeConfig config) {
//        在随机的x轴开始，在随机的x轴结束，y轴同理。以随机颜色绘制一条线
        for (int i = 0; i < config.getLineCount(); i++) {
            g.setColor(randomColor(16,240));
            g.drawLine(RANDOM.nextInt(config.getImageWidth()),
                    RANDOM.nextInt(config.getImageHeight()),
                    RANDOM.nextInt(config.getImageWidth()),
                    RANDOM.nextInt(config.getImageHeight()));
        }
//        绘制干扰点,x,y表示起始坐标
        for (int i = 0; i < config.getPointCount(); i++) {
            g.setColor(randomColor(16,240));
            g.drawOval(RANDOM.nextInt(config.getImageWidth()),
                    RANDOM.nextInt(config.getImageHeight()),
                    1,1);
        }
    }

    //    生成对应验证码图片
    private CodeImageResult createCodeImage(ValidateCodeConfig config){
//        创建用于多线程的画布
        BufferedImage image = new BufferedImage(config.getImageWidth(), config.getImageHeight(),BufferedImage.TYPE_INT_RGB);
//        创建画笔
        Graphics2D g = image.createGraphics();
        try{
            drawBackground(g, config);
            StringBuilder code = randomCode(config);
            drawCode(code, g, config);
            drawInterference(g, config);
            return new CodeImageResult(code.toString(), image);
        }finally {
//            释放画笔资源
            g.dispose();
        }
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CodeImageResult {
        private String code;
        private BufferedImage image;
    }


}
