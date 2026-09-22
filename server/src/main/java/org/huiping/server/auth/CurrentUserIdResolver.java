package org.huiping.server.auth;

import org.huiping.server.exception.ApiException;
import org.jspecify.annotations.Nullable;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * 解析Controller接口的@CurrentUserId注解
 * 用于从request attribute 中获取 userId
 * 减少接口参数中HttpServletRequest的出现频次
 */
public class CurrentUserIdResolver implements HandlerMethodArgumentResolver {

//    判断参数是否需要执行resolveArgument方法
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
//        通过拥有@CurrentUserId注解并声明为Long数据类型的接口参数
//        例如 @CurrentUserId Long userId
//        注意，由于属于声明，不等同于数据本身类型为Long，详见resolve的if判断
        return parameter.hasParameterAnnotation(CurrentUserId.class) &&
                Long.class.equals(parameter.getParameterType());
    }

    @Override
    public @Nullable Object resolveArgument(MethodParameter parameter,
                                            @Nullable ModelAndViewContainer mavContainer,
                                            NativeWebRequest webRequest,
                                            @Nullable WebDataBinderFactory binderFactory){
//        详见小程序 auth.js的请求头数据封装
        Object userId = webRequest.getAttribute(
                AuthConstants.AUTH_USER_ID, RequestAttributes.SCOPE_REQUEST);
        CurrentUserId annotation = parameter.getParameterAnnotation(CurrentUserId.class);
//        解析required字段，允许设置为@CurrentUserId(required = false)
        boolean required = annotation == null || annotation.required();
//        受限于supports不校验入参数据，若为null或不为Long属性的数据，则会抛出异常
//        判断userId是否为Long，若为则赋值给id，再判断id数据为null
        if (!(userId instanceof Long id)) {
            if (required) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "未登录或缺少 token");
            }
            return null;
        }
        return id;
    }
}
