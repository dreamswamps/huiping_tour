package com.example.Controller;

import com.example.POJO.Article;
import com.example.Service.AdminService;
import com.example.Service.ArticleService;
import com.example.Util.Result;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/article")
public class ArticleController {

    @Resource
    private ArticleService articleService;
    @Resource
    private AdminService adminService;

    @PostMapping("/add")
    public Result addArticle(@RequestBody Article article,
                             @RequestHeader("X-Current-User-ID") Integer currentUserId) {
        return Result.success(articleService.addArticle(article,currentUserId));
    }

    @DeleteMapping("/deletebyid/{id}")
    public Result SoftDeleteArticleById(@PathVariable Integer id,
                                        @RequestHeader("X-Current-User-ID") Integer currentUserId) {
        adminService.IDAuthManager(currentUserId);
        return Result.success(articleService.SoftDeleteArticleById(id));
    }

    @DeleteMapping("/deletebatch")
    public Result DeleteBatch(@RequestBody List<Integer> ids,
                              @RequestHeader("X-Current-User-ID") Integer currentUserId) {
        adminService.IDAuthManager(currentUserId);
        articleService.DeleteBatch(ids);
        return Result.success("批量删除成功");
    }

    @PostMapping("/undo")
    public Result Undo(@RequestBody List<Integer> ids,
                       @RequestHeader("X-Current-User-ID") Integer currentUserId) {
        adminService.IDAuthManager(currentUserId);
        articleService.Undo(ids);
        return Result.success("撤回成功");
    }

    @PutMapping("/updatebyid")
    public Result updateArticleById(@RequestBody Article article,
                                    @RequestHeader("X-Current-User-ID") Integer currentUserId) {
        adminService.IDAuthManager(currentUserId);
        return Result.success(articleService.updateArticleById(article));
    }

    @GetMapping("/get/{id}")
    public Result getArticleById(@PathVariable Integer id) {
        return Result.success(articleService.getArticleById(id));
    }

    @GetMapping("/all")
    public Result getAllArticles(Article article) {
        return Result.success(articleService.getAllArticles(article));
    }

    @GetMapping("/selectpage")
    public Result SelectPage(Article article,
                             @RequestParam(defaultValue = "1") int pageNum,
                             @RequestParam(defaultValue = "10") int pageSize) {
        PageInfo<Article> pageInfo = articleService.SelectPage(pageNum, pageSize,article);
        return Result.success(pageInfo);
    }

    /*
    http://localhost:8081/article/articlerecentselect
    查询近期发表的新文章，并统计出文章数量
     */
    @GetMapping("/articlerecentselect")
    public Result ArticleRecentSelect() {
        return Result.success(articleService.ArticleRecentSelect());
    }
}
