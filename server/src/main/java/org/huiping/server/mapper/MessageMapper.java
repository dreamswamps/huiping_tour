package org.huiping.server.mapper;

import org.apache.ibatis.annotations.Param;
import org.huiping.server.entity.Message;

import java.util.List;

public interface MessageMapper {
    /** 按时间倒序取最新 limit 条（含 user_id，供 Service 内存排序）。 */
    List<Message> selectLatest(@Param("limit") int limit);

    /** 按 id 查单条留言。 */
    Message selectById(@Param("id") Long id);

    /** 插入留言；写入后通过实体的 id 回填自增主键。 */
    int insert(Message message);
}
