package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.MessageResponse;
import br.unicesumar.onefreela.dto.MessageSendDTO;
import br.unicesumar.onefreela.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/order/{orderId}")
    public MessageResponse sendMessage(@PathVariable Long orderId, @RequestBody MessageSendDTO dto, HttpServletRequest request) {
        return chatService.sendMessage(orderId, dto, request);
    }

    @GetMapping("/order/{orderId}")
    public List<MessageResponse> getMessages(@PathVariable Long orderId, HttpServletRequest request) {
        return chatService.getMessages(orderId, request);
    }
}