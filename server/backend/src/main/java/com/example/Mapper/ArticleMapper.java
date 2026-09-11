package com.example.Mapper;

import com.example.POJO.Article;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.Date;
import java.util.List;

@Mapper
public interface ArticleMapper {
    int insert(Article article);
    @Update("UPDATE article SET is_deleted = 1 WHERE id = #{id}")
    int SoftDeleteById(Integer id);
    int SoftDeleteByIds(List<Integer> ids);
    int UndoByIds(List<Integer> ids);
    int updateById(Article article);
    Article selectById(Integer id);
    List<Article> selectAll(Article article);

    @Select("SELECT time FROM article WHERE is_deleted = 0")
    List<Date> selectAllTime();
}
