package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.AttachmentDownload;
import br.unicesumar.onefreela.dto.ChatMessageDTO;
import br.unicesumar.onefreela.dto.DeliverDTO;
import br.unicesumar.onefreela.dto.MessageResponse;
import br.unicesumar.onefreela.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/orderItem/{orderItemId}/message")
    public MessageResponse sendMessage(@PathVariable Long orderItemId, @ModelAttribute ChatMessageDTO dto, HttpServletRequest request) {
        return chatService.sendMessage(orderItemId, dto, request);
    }

    @GetMapping("/orderItem/{orderItemId}")
    public List<MessageResponse> getMessages(@PathVariable Long orderItemId, HttpServletRequest request) {
        return chatService.getMessages(orderItemId, request);
    }

    @PostMapping("/orderItem/{orderItemId}/delivery")
    public MessageResponse makeDelivery(@PathVariable Long orderItemId, @ModelAttribute DeliverDTO dto, HttpServletRequest request) {
        return chatService.makeDelivery(orderItemId, dto, request);
    }

    @PostMapping("/orderItem/{orderItemId}/acceptDelivery")
    public MessageResponse acceptDelivery(@PathVariable Long orderItemId, HttpServletRequest request) {
        return chatService.acceptDelivery(orderItemId, request);
    }

    @PostMapping("/orderItem/{orderItemId}/refuseDelivery")
    public MessageResponse refuseDelivery(@PathVariable Long orderItemId, @RequestParam(required = false) String message, HttpServletRequest request) {
        return chatService.refuseDelivery(orderItemId, message, request);
    }

    @PostMapping("/orderItem/{orderItemId}/acceptAdjustment")
    public MessageResponse acceptAdjustment(@PathVariable Long orderItemId, HttpServletRequest request) {
        return chatService.acceptAdjustment(orderItemId, request);
    }

    @PostMapping("/orderItem/{orderItemId}/refuseAdjustment")
    public MessageResponse refuseAdjustment(@PathVariable Long orderItemId, HttpServletRequest request) {
        return chatService.refuseAdjustment(orderItemId, request);
    }

    @PostMapping("/orderItem/{orderItemId}/openDispute")
    public MessageResponse openDispute(@PathVariable Long orderItemId, HttpServletRequest request) {
        return chatService.openDispute(orderItemId, request);
    }

    @PostMapping("/orderItem/{orderItemId}/acceptDeliveryAfterFreeze")
    public MessageResponse acceptDeliveryAfterFreeze(@PathVariable Long orderItemId, HttpServletRequest request) {
        return chatService.acceptDeliveryAfterFreeze(orderItemId, request);
    }

    @GetMapping("/orderItem/{orderItemId}/attachment/{source}/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long orderItemId, @PathVariable String source, @PathVariable Long attachmentId, HttpServletRequest request) {
        AttachmentDownload download = chatService.downloadAttachment(orderItemId, source, attachmentId, request);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(download.getContentType());
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(download.getFilename() != null ? download.getFilename() : "arquivo").build().toString())
                .body(download.getResource());
    }
}