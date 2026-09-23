package org.huiping.server.service;

import org.huiping.server.entity.Message;
import org.huiping.server.exception.ApiException;
import org.huiping.server.mapper.MessageMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class MessageService {
    /** 留言内容上限。 */
    private static final int MAX_CONTENT_LEN = 50;
    /** 未登录列表返回条数。 */
    private static final int LIST_LIMIT = 100;
    /** 已登录用户排序：先拉一批再在内存里拼顺序，避免漏数据。 */
    private static final int FETCH_CAP = 300;

    private final MessageMapper messageMapper;
    public MessageService(MessageMapper messageMapper) { this.messageMapper = messageMapper; }

    /**
     * 留言列表：未登录直接按时间倒序；已登录把「他人最新一条」顶到最前，
     * 之后接自己的全部（新→旧），再接其余他人，最后截取 100 条。
     */
    public List<Message> listMessage(Long userId) {
        if (userId != null) {
            List<Message> raw = messageMapper.selectLatest(FETCH_CAP);
            List<Message> mine = new ArrayList<>();
            List<Message> others = new ArrayList<>();
            for (Message row : raw) {
                boolean isMine = Objects.equals(row.getUserId(), userId);
                (isMine ? mine : others).add(row);
            }
            List<Message> merged = new ArrayList<>();
            if (others.isEmpty()) {
                merged.addAll(mine);
            } else {
                // 第 1 条：他人最新一条；第 2 条起：自己的全部（新→旧）；再接其余他人
                merged.add(others.get(0));
                merged.addAll(mine);
                merged.addAll(others.subList(1, others.size()));
            }
            return merged.subList(0, Math.min(LIST_LIMIT, merged.size()));
        }
        return messageMapper.selectLatest(LIST_LIMIT);
    }

    /** 发布留言并返回新留言数据。 */
    public Message addMessage(Long userId, String content) {
        if (content == null || content.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "留言内容不能为空");
        }
        content = content.trim();
        if (content.length() > MAX_CONTENT_LEN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "留言最多" + MAX_CONTENT_LEN + "字");
        }
        Message message = new Message();
        message.setUserId(userId);
        message.setContent(content);
        messageMapper.insert(message);
        return messageMapper.selectById(message.getId());
    }
}
