package org.huiping.server.controller;

import org.huiping.server.auth.CurrentUserId;
import org.huiping.server.common.Result;
import org.huiping.server.entity.Message;
import org.springframework.web.bind.annotation.*;
import org.huiping.server.service.MessageService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController{
    private final MessageService messageService;

    public MessageController(MessageService messageService) { this.messageService = messageService; }

    /** 留言列表；有合法 token 时做登录用户排序，否则按时间倒序返回。 */
    @GetMapping({"", "/"})
    public Result<List<Message>> listMessage(@CurrentUserId(required = false) Long userId) {
        return Result.success(messageService.listMessage(userId));
    }

    /** 发布留言，返回新留言数据。 */
//    由于该接口调用频率过低，暂时不考虑使用DTO
//    TODO 想加就加
    @PostMapping({"", "/"})
    public Result<Message> addMessage(@CurrentUserId Long userId,
                                      @RequestBody Map<String, Object> body) {
        String content = body.get("content") instanceof String value ? value : null;
        return Result.success("发布成功", messageService.addMessage(userId, content));
    }
}
