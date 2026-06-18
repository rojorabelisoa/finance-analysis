package com.rojorabelisoa.finance.settings;

import com.rojorabelisoa.finance.portfolio.dto.PortfolioHistoryDto;
import com.rojorabelisoa.finance.settings.dto.PeaInfoDto;
import com.rojorabelisoa.finance.settings.dto.UserSettingsDto;
import com.rojorabelisoa.finance.user.User;
import com.rojorabelisoa.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class UserSettingsController {

    private final UserSettingsService userSettingsService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<UserSettings> getSettings() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = loadUser(username);
        return ResponseEntity.ok(userSettingsService.getSettings(user.getId()));
    }

    @PutMapping
    public ResponseEntity<UserSettings> updateSettings(@RequestBody UserSettingsDto dto) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = loadUser(username);
        return ResponseEntity.ok(userSettingsService.updateSettings(user.getId(), dto));
    }

    @GetMapping("/pea")
    public ResponseEntity<PeaInfoDto> getPeaInfo() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userSettingsService.getPeaInfo(username));
    }

    private User loadUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
    }
}
