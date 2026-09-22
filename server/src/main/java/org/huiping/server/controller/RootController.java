package org.huiping.server.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 该接口仅用于安全检查，不被调用且不参与业务逻辑
 * 暂时留着
 */
@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, Object> root() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("code", 200);
        result.put("message", "红旅薪传后端服务运行中");
        result.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/M/d HH:mm:ss")));
        return result;
    }
}
