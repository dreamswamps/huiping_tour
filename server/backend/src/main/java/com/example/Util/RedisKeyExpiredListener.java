package com.example.Util;

import com.example.Service.Application.ApprovalService;
import jakarta.annotation.Resource;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.listener.KeyExpirationEventMessageListener;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

@Component
public class RedisKeyExpiredListener extends KeyExpirationEventMessageListener {

    public RedisKeyExpiredListener(RedisMessageListenerContainer listenerContainer) {
        super(listenerContainer);
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = message.toString();
        if (expiredKey.startsWith("lock:token:")) {
            String token = expiredKey.substring("lock:token:".length());
            unlockApplicationInMySQL(token);
        }
    }

    @Resource
    private ApprovalService approvalService;

    private void unlockApplicationInMySQL(String token) {
        approvalService.unlockByRedisMessage(token);
    }
}
