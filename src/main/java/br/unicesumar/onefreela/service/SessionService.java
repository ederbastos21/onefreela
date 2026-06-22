package br.unicesumar.onefreela.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class SessionService {

    public static final long SESSION_TTL_HOURS = 1;
    public static final long SESSION_TTL_MS = TimeUnit.HOURS.toMillis(SESSION_TTL_HOURS);

    private final RedisTemplate<String,String> redisTemplate;

     public SessionService (RedisTemplate<String, String> redisTemplate){
        this.redisTemplate = redisTemplate;
    }

    public String storeSession (Long id){
         try{
             String token = UUID.randomUUID().toString();
             String userId = id.toString();
             redisTemplate.opsForValue().set(token, userId, SESSION_TTL_HOURS, TimeUnit.HOURS);
             redisTemplate.opsForValue().set(userId, token, SESSION_TTL_HOURS, TimeUnit.HOURS);

             return token;
         } catch (Exception e){
             System.out.println("erro: nao pode criar sessao no redis" + e);
             throw new RuntimeException("Erro ao criar sessão", e);
         }
    }

    public String getSession (String token){
         return redisTemplate.opsForValue().get(token);
    }

    public String getSession (Long id){
         String idString = id.toString();
         return redisTemplate.opsForValue().get(idString);
    }
}