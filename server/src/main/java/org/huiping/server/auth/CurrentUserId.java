package org.huiping.server.auth;

import java.lang.annotation.*;

/**
 * 与小程序auth.js中getAuthHeaders方法配合
 * 在 Controller 参数中使用，标记需要传入userId做身份校验
 */

/**
 * @interface 表定义注解
 * @Target(ElementType.PARAMETER) 表该注解只能用于方法参数
 * @Retention(RetentionPolicy.RUNTIME) 表该注解由JVM加载，可在运行时被反射读取
 * @Documented 表该注解可生成在Javadoc文档中 非必要
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface CurrentUserId {
    boolean required() default true;
}
