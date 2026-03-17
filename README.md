# Relatório de Serviço — 3º BPM

## Rodar o projeto

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em desenvolvimento
npm run dev

# 3. Build para produção (Netlify / Vercel)
npm run build
```

---

## Configurar no Firebase Console (obrigatório antes de rodar)

### 1. Ativar Authentication → E-mail/Senha
Firebase Console → Authentication → Sign-in method → Email/Password → Ativar

### 2. Criar índices no Firestore
Firebase Console → Firestore → Índices → Adicionar índice composto:

| Coleção | Campo 1    | Ordem | Campo 2    | Ordem |
|---------|------------|-------|------------|-------|
| reports | createdAt  | Desc  | —          | —     |
| reports | createdBy  | Asc   | createdAt  | Desc  |

> Sem esses índices, a listagem de relatórios vai falhar em produção.

### 3. Aplicar as regras do Firestore
Copie o conteúdo de `firestore.rules` e cole em:
Firebase Console → Firestore → Regras → Publicar

---

## Criar o primeiro usuário gestor

1. Vá em Firebase Console → Authentication → Users → Add User
   - E-mail: `seu@email.com`
   - Senha: `suasenha`

2. Copie o UID gerado

3. Vá em Firestore → reports (coleção) → Iniciar coleção: `users`
   - Document ID: `<UID copiado>`
   - Campos:
     ```
     nome     → "WENDELL"          (string)
     grad     → "1ºSGT"            (string)
     mat      → "96434"            (string)
     papel    → "gestor"           (string)  ← gestor vê tudo
     email    → "seu@email.com"    (string)
     ```

4. Demais usuários que fizerem login pela primeira vez serão criados
   automaticamente como `operador`. Para promover a gestor, edite o
   campo `papel` no Firestore Console.

---

## Estrutura de arquivos

```
src/
  lib/
    firebase.ts        ← configuração Firebase (já preenchida)
    reports.ts         ← CRUD Firestore (coleção `reports`)
    exportPdf.ts       ← geração de PDF
    exportXlsx.ts      ← geração de Excel
  types/
    report.ts          ← tipos que espelham o schema do Firestore
  contexts/
    AuthContext.tsx    ← autenticação + perfil do usuário
  hooks/
    useReports.ts      ← carregamento com papel (gestor/operador)
  components/
    form/
      EfetivoTable.tsx      ← seção 1
      AlteracoesTable.tsx   ← seção 1.3
      ResumoOps.tsx         ← seção 2
    shared/
      Toast.tsx             ← notificações
      ModalRelatorio.tsx    ← modal de visualização
  pages/
    Login.tsx
    NovoRelatorio.tsx
    Salvos.tsx
    Historico.tsx      ← apenas gestor
  App.tsx              ← layout, tabs, roteamento
  main.tsx
  index.css
```

---

## Papéis

| Ação                        | Operador | Gestor |
|-----------------------------|----------|--------|
| Criar relatório             | ✅       | ✅     |
| Ver próprios relatórios     | ✅       | ✅     |
| Ver todos os relatórios     | ❌       | ✅     |
| Histórico por militar       | ❌       | ✅     |
| Excel consolidado           | ❌       | ✅     |
| Excluir qualquer relatório  | ❌       | ✅     |
| Excluir próprio relatório   | ✅       | ✅     |

---

## Deploy no Netlify

```bash
npm run build
# Faça upload da pasta `dist/` no Netlify
# ou conecte o repositório Git ao Netlify (build command: npm run build, publish: dist)
```

Adicione o arquivo `public/_redirects` com:
```
/*  /index.html  200
```
