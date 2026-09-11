package com.example.Service.Strategy;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@ConfigurationProperties(prefix = "apply.strategy")
public class ApplyStrategyMap {
//    保证map至少为空的HashMap而不是null,避免业务逻辑中因为get到null抛出的空指针问题
    private Map<String, String> map = new HashMap<>();
    public Map<String, String> getMap() {
        return map;
    }
}
