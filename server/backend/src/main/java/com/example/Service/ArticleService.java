package com.example.Service;

import com.example.Exception.CustomException;
import com.example.Mapper.AdminMapper;
import com.example.Mapper.ArticleMapper;
import com.example.POJO.Admin;
import com.example.POJO.Article;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class ArticleService {

    @Resource
    private ArticleMapper articleMapper;
    @Resource
    private AdminMapper adminMapper;

    public int addArticle(Article article,Integer currentUserId) {
        Admin existAdmin = adminMapper.ExistAdmin(currentUserId);
        if (existAdmin != null) {
            article.setPublisher_id(currentUserId);
            article.setPublisher_name(existAdmin.getName());
            Date date = new Date();
            article.setTime(date);
            return articleMapper.insert(article);
        }
        throw new CustomException("401","该账号不允许撰写文章");
    }

    public int SoftDeleteArticleById(Integer id) {
        return articleMapper.SoftDeleteById(id);
    }

    public int updateArticleById(Article article) {
        return articleMapper.updateById(article);
    }

    public Article getArticleById(Integer id) {
        return articleMapper.selectById(id);
    }

    public List<Article> getAllArticles(Article article) {
        return articleMapper.selectAll(article);
    }

    public PageInfo<Article> SelectPage(int pageNum, int pageSize, Article article) {
        PageHelper.startPage(pageNum, pageSize);
        List<Article> list = articleMapper.selectAll(article);
        return PageInfo.of(list);
    }

    public void DeleteBatch(List<Integer> ids) {
        articleMapper.SoftDeleteByIds(ids);
    }

    public void Undo(List<Integer> ids) {
        articleMapper.UndoByIds(ids);
    }

    public Map<String,Object> ArticleRecentSelect() {
        List<Date> dateList = articleMapper.selectAllTime();
        Map<String,Object> result = new HashMap<>();
        Date now = new Date();  //  当前时间

//        计算时间范围
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(now);
        calendar.add(Calendar.DAY_OF_YEAR, -1);
        Date oneDayAgo = calendar.getTime();

        calendar.setTime(now);
        calendar.add(Calendar.WEEK_OF_YEAR, -1);
        Date oneWeekAgo = calendar.getTime();

        calendar.setTime(now);
        calendar.add(Calendar.DAY_OF_YEAR, -30);
        Date oneMonthAgo = calendar.getTime();

//        时间计算数组
        List<Date> dateRangeList = new ArrayList<>();
        dateRangeList.add(oneDayAgo);
        dateRangeList.add(oneWeekAgo);
        dateRangeList.add(oneMonthAgo);

//        时间范围文本数组
        List<String> dateRangeStrList = new ArrayList<>();
        dateRangeStrList.add("最近一日");
        dateRangeStrList.add("最近一周");
        dateRangeStrList.add("最近一月");

//        计算对应天数内的数据量
        List<Integer> dateCountList = new ArrayList<>();
        for (Date range : dateRangeList) {
            dateCountList.add((int) dateList.stream().filter(Objects::nonNull).filter(date -> date.after(range) && date.before(now)).count());
        }
        result.put("dateCountList", dateCountList);
//        result.put("dateRangeList", dateRangeList);
        result.put("dateRangeStrList", dateRangeStrList);
        return result;
    }
}
