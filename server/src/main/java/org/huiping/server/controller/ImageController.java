package org.huiping.server.controller;

import org.huiping.server.common.Result;
import org.huiping.server.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

/**
 * 该接口作用意义不明，暂时保留
 * 这并不是获取图片资源的接口
 */
@RestController
@RequestMapping("/api/images")
public class ImageController{
    private final Path imageDirectory;

//    构造函数，和@Value作用一样
    public ImageController(@Value("${app.image-directory:img}") String imageDirectory) {
        this.imageDirectory = Path.of(imageDirectory);
    }

    @GetMapping
    public Result<List<Map<String, String>>> images() {
        try {
            List<Map<String, String>> list = new ArrayList<>();
            try (var files = Files.list(imageDirectory)) {
                files.filter(Files::isRegularFile).forEach(file ->
                        list.add(Map.of("name", file.getFileName().toString(),
                                "url", "/" + imageDirectory + "/" + file.getFileName())));
            }
            return Result.success(list);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "读取图片目录失败");
        }
    }
}