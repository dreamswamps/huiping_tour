package com.example.Controller;

import com.example.Exception.CustomException;
import com.example.POJO.Admin;
import com.example.Service.AdminService;
import com.example.Util.Result;
import jakarta.annotation.Resource;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/files")
public class FileController {

    @Resource
    AdminService adminService;

//    获取到当前项目的根路径 => 目录路径
    public static final String PerFilePath = System.getProperty("user.dir")+"/files/permanent";
    public static final String TemFilePath = System.getProperty("user.dir")+"/files/temporary";


    @PostMapping("/upload")
    public Result upload(@RequestParam("file") MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();

        Path upload_path = Path.of(PerFilePath);
//        判断是否存在对应目录，没有则创建目录
        if(!Files.isDirectory(upload_path)){
//            创建多级目录，如果upload_path中包含父级目录，也能成功创建
                Files.createDirectories(upload_path);
            }

//        提供完整路径以实现保存
//        完整路径 = 目录路径 + 文件名称
//        为了区别同名文件，在文件名称前加入一个时间戳作为标记 => 文件名称
        String fileName = System.currentTimeMillis() + "_" + originalFilename;
//        拼接组成 => 完整路径
//        resolve可以根据系统Win/Linux自动修改分隔符，是一种路径Path的拼接，而不是字符串拼接
        try {
            file.transferTo(upload_path.resolve(fileName));
        }catch (IOException e){
            throw new CustomException("500","文件上传失败");
        }
//        告知前端可以获取对应图像的URL
        String URL = "http://localhost:8081/files/download/" + fileName;
        return Result.success(URL);
    }

    /*
    用于上传至缓存文件夹
    该接口返回的数据中，仅包含文件名称，不进行地址拼接
    实则复制上面的代码=-=
     */
    @PostMapping("/tem/upload")
    public Result temUpload(@RequestParam("file") MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        Path upload_path = Path.of(TemFilePath);
        if(!Files.isDirectory(upload_path)){
            Files.createDirectories(upload_path);
        }
        String fileName = System.currentTimeMillis() + "_" + originalFilename;
        try {
            file.transferTo(upload_path.resolve(fileName));
        }catch (IOException e){
            throw new CustomException("500","文件上传失败");
        }
        return Result.success(fileName);
    }

    /*
    http://localhost:8081/files/download/1756551034033_4549-2024-08-09095055-1723211455239.jpg
    可以直接在浏览器中完成下载
     */
    @GetMapping("/download/{fileName}")
    public void download(@PathVariable("fileName") String fileName, HttpServletResponse response) throws IOException {

        try {
//            声明请求头和请求类型，以应对可能的乱码问题
            response.addHeader("Content-Disposition", "attachment; filename=" + URLEncoder.encode(fileName, StandardCharsets.UTF_8));
            response.setContentType("application/octet-stream");
//            输出流
            ServletOutputStream os = response.getOutputStream();
//            获取文件的字节流/字节数组
            byte[] bytes = Files.readAllBytes(Path.of(PerFilePath).resolve(fileName));
//            在输出流中以字节流的新式传递数据
            os.write(bytes);
//            刷新输出流并关闭输出流
            os.flush();
            os.close();
        }catch (IOException e){
            throw new CustomException("500","文件下载失败");
        }
    }

    /*
    富文本编辑器 文件上传接口
     */
    @PostMapping("/wangEditor/upload")
    public Map<String,Object> wangEditorUpload(@RequestParam("file") MultipartFile file) throws IOException {
        Map<String, Object> result = new HashMap<>();
        List<Map<String,Object>> list = new ArrayList<>();
        Map<String,Object> urlmap = new HashMap<>();
        try {
            String originalFilename = file.getOriginalFilename();
            Path uploadPath = Path.of(PerFilePath);
            if (!Files.isDirectory(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String fileName = System.currentTimeMillis() + "_" + originalFilename;
            file.transferTo(uploadPath.resolve(fileName));
            String url = "http://localhost:8081/files/download/" + fileName;

            result.put("errno", 0); // 0 表示成功
            urlmap.put("url", url);
            list.add(urlmap);
            result.put("data", list);
        } catch (Exception e) {
            result.put("errno", 1); // 非0 表示失败
            result.put("message", "文件上传失败");
        }
        return result;
    }

    /*
    excel导出流连接
     */
    @GetMapping("/export")
    public void exportExcel(HttpServletResponse response) throws IOException {
//        获取所有数据
        List<Admin> adminList = adminService.SelectAll(null);
//        构建 Excel
        try {
            // 设置响应内容类型和请求头
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
            String fileName = URLEncoder.encode("用户列表", "UTF-8");   //  可在这里修改文件名称
//            该请求头表示，告知前端页面不需要显示内容，作为附件下载
            response.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + fileName + ".xlsx");
//            创建Excel表
            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("Admins");
//            创建表头
            Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("编号");
            headerRow.createCell(1).setCellValue("姓名");
            headerRow.createCell(2).setCellValue("加入时间");
            headerRow.createCell(3).setCellValue("性别");
            headerRow.createCell(4).setCellValue("电话");
            headerRow.createCell(5).setCellValue("头像");
            headerRow.createCell(6).setCellValue("身份");
            headerRow.createCell(7).setCellValue("邮箱");
//            提供日期样式
            CellStyle datestyle = workbook.createCellStyle();
            CreationHelper createHelper = workbook.getCreationHelper();
            datestyle.setDataFormat(createHelper.createDataFormat().getFormat("yyyy-MM-dd"));
//            填充数据
            int rowNum = 1;
            for (Admin admin : adminList) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(admin.getId());
                row.createCell(1).setCellValue(admin.getName());
                Cell datecell = row.createCell(2);
                datecell.setCellValue(admin.getAddtime());
                datecell.setCellStyle(datestyle);
                row.createCell(3).setCellValue(admin.getGender());
                row.createCell(4).setCellValue(admin.getPhone());
                row.createCell(5).setCellValue(admin.getAvatar());
                row.createCell(6).setCellValue(admin.getEmail());
            }
//            自动调整excel单元格宽度，并提供最小和最大宽度
            int minWidth = 5 * 256;
            int maxWidth = 50 * 256;
            for(int i = 1; i < adminList.size(); i++){
                sheet.autoSizeColumn(i);
                int width = sheet.getColumnWidth(i);
                if(width < minWidth){
                    sheet.setColumnWidth(i, minWidth);
                }else if(width > maxWidth){
                    sheet.setColumnWidth(i, maxWidth);
                }
            }
//            获取Http相应输出流并写入Excel
            workbook.write(response.getOutputStream());
            workbook.close();
        }catch (IOException e){
            throw new RuntimeException("导出Excel失败",e);
        }
    }

    /*
    excel导入
     */
    @PostMapping("/import")
    public Result importExcel(@RequestParam("file") MultipartFile file) throws IOException {
        try{
//            检查文件
            if (file.isEmpty()) {
                throw new CustomException("500","请选择文件");
            }

            if (!file.getOriginalFilename().endsWith(".xlsx") && !file.getOriginalFilename().endsWith(".xls")) {
                throw new CustomException("500","仅支持Excel文件");
            }

            Workbook workbook = new XSSFWorkbook(file.getInputStream());
            Sheet sheet = workbook.getSheetAt(0);
            List<Admin> adminList = new ArrayList<>();
//            设置为1以跳过表头
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                Admin admin = new Admin();

//                避免空指针问题
                Cell idCell = row.getCell(0);
                if (idCell != null && idCell.getCellType() == CellType.NUMERIC) {
                    admin.setId((int) idCell.getNumericCellValue());
                }

                Cell nameCell = row.getCell(1);
                if (nameCell != null && nameCell.getCellType() == CellType.STRING) {
                    admin.setName(nameCell.getStringCellValue());
                }

                Cell timeCell = row.getCell(2);
                if (timeCell != null && timeCell.getCellType() == CellType.NUMERIC) {
                    admin.setAddtime(timeCell.getDateCellValue());
                }

                Cell genderCell = row.getCell(3);
                if (genderCell != null && genderCell.getCellType() == CellType.STRING) {
                    admin.setGender(genderCell.getStringCellValue());
                }

                Cell phoneCell = row.getCell(4);
                if (phoneCell != null && phoneCell.getCellType() == CellType.STRING) {
                    admin.setPhone(phoneCell.getStringCellValue());
                }

                Cell avatarCell = row.getCell(5);
                if (avatarCell != null && avatarCell.getCellType() == CellType.STRING) {
                    admin.setAvatar(avatarCell.getStringCellValue());
                }
                admin.setIs_deleted(0);
                adminList.add(admin);
            }
            adminService.InsertAdminList(adminList);
            workbook.close();
            return Result.success("导入成功");
        }catch (IOException e){
            throw new RuntimeException("导入Excel失败", e);
        }
    }

    /*
    根据传入的文件名称数组批量删除文件
    该接口只能删除tem缓存文件夹中的文件
     */
    @PostMapping("/tem/delete")
    public Result temDeleteFile(@RequestBody List<String> fileNames){
        if(fileNames == null || fileNames.isEmpty()){
            return Result.error("400","至少提供一个需要删除的文件名");
        }

        List<String> failFiles = new ArrayList<>();
        List<String> successFiles = new ArrayList<>();
        for (String fileName : fileNames) {
            try {
//                检测空文件名
                if (fileName == null || fileName.isEmpty()) {
                    failFiles.add(fileName + "（空文件名）");
                    continue;
                }

//                防止能够修改文件路径的文件名
                if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
                    failFiles.add(fileName + "（非法文件名）");
                    continue;
                }

//                开始删除文件
                Path filePath = Path.of(FileController.TemFilePath).resolve(fileName);
                if (!Files.exists(filePath)) {
                    failFiles.add(fileName + "（文件不存在）");
                }

                Files.delete(filePath);
                successFiles.add(fileName);
            } catch (IOException e) {
                failFiles.add(fileName + "（删除失败）");
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("failFiles", failFiles);
        result.put("successFiles", successFiles);

        if (failFiles.isEmpty()) {
            return Result.success("文件删除成功");
        } else if (successFiles.isEmpty()) {
            return Result.error("500","所有文件删除失败");
        } else {
            return Result.success("部分文件删除成功",result);
        }
    }

    /*
    该接口用于将tem文件夹的指定文件移动至per文件夹中
     */
    @PostMapping("/tem/move")
    public Result temMoveFileToPer(@RequestBody List<String> fileNames){
        if(fileNames == null || fileNames.isEmpty()){
            return Result.error("400","至少提供一个需要移动的文件名");
        }

        List<String> failFiles = new ArrayList<>();
        List<String> successFiles = new ArrayList<>();
        List<String> successFilesPath = new ArrayList<>();
        for (String fileName : fileNames) {
            try {
                if (fileName == null || fileName.isEmpty() || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
                    failFiles.add(fileName + "（非法文件）");
                    continue;
                }

                Path temFilePath = Path.of(FileController.TemFilePath).resolve(fileName);
                Path perFilePath = Path.of(FileController.PerFilePath).resolve(fileName);
                if (!Files.exists(temFilePath)) {
                    failFiles.add(fileName + "（未找到文件）");
                    continue;
                }
//                乐观认为所有move操作都是成功的
                successFiles.add(fileName);
                Files.move(temFilePath, perFilePath);
            } catch (IOException e) {
                failFiles.add(fileName + "（异常文件）");
            }
        }

//        所有移动操作后等待100ms检查预期成功的文件是否已经存在
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {}

        for (String fileName : successFiles) {
            try {
                Path perFilePath = Path.of(FileController.PerFilePath).resolve(fileName);

                if (Files.exists(perFilePath)) {
                    successFilesPath.add("http://localhost:8081/files/download/" + fileName);
                } else {
                    failFiles.add(fileName + "（移动失败）");
                }
            } catch (Exception e) {
                failFiles.add((fileName + "（异常文件）"));
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("failFiles", failFiles);
        result.put("successFilesPath", successFilesPath);
        return Result.success("文件移动完毕",result);
    }

}
