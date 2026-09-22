package org.huiping.server.controller;

import org.huiping.server.common.Result;
import org.huiping.server.entity.Spot;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import org.huiping.server.service.SpotService;

@RestController
@RequestMapping("/api")
public class SpotController{
    private final SpotService spotService;

    public SpotController(SpotService spotService) { this.spotService = spotService; }

    @GetMapping("/spots")
    public Result<List<Spot>> spots() {
        return Result.success(spotService.list());
    }
}