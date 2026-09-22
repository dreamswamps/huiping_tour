package org.huiping.server.config;

import org.huiping.server.auth.CurrentUserIdResolver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.util.List;

/**
 * Spring MVC拓展接口
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final Path imageDirectory;

    public WebMvcConfig(@Value("${app.image-directory:img}") String imageDirectory) {
        this.imageDirectory = Path.of(imageDirectory);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/img/**")
                .addResourceLocations("file:" + imageDirectory.toAbsolutePath() + "/");
    }

    @Override
    public void addArgumentResolvers(final List<HandlerMethodArgumentResolver> argumentResolvers) {
        argumentResolvers.add(new CurrentUserIdResolver());
    }
}
