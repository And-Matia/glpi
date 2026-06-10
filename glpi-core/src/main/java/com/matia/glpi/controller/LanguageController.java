package com.matia.glpi.controller;

import com.matia.glpi.repository.LanguageRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@RequestMapping("/languages")
public class LanguageController {
    private final LanguageRepository languageRepository;

    public LanguageController(LanguageRepository languageRepository) {
        this.languageRepository = languageRepository;
    }

    @GetMapping
    public ResponseEntity<?> getLanguages() {
        return ResponseEntity.ok(languageRepository.findAll());
    }
}
