// src/lib/pocketbase.ts
import PocketBase, { RecordModel as PBRecord } from 'pocketbase';

const resolvePocketBaseUrl = () => {
  const envValue = import.meta.env.VITE_POCKETBASE_URL;

  if (envValue) {
    if (/^https?:\/\//i.test(envValue)) {
      return envValue;
    }

    if (typeof window !== "undefined") {
      const prefix = envValue.startsWith("/") ? "" : "/";
      return `${window.location.origin}${prefix}${envValue}`;
    }
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/pb`;
  }

  return "http://127.0.0.1:8090";
};

const POCKETBASE_URL = resolvePocketBaseUrl();

export const pb = new PocketBase(POCKETBASE_URL);

// --- Tipos de dados ---

/**
 * Modelo de usuário conforme definido na collection "users" do PocketBase.
 * Estende o Record padrão do SDK, que já inclui id, created, updated, etc.
 */
export interface UserRecord extends PBRecord {
  email: string;
  name: string;          // Nome completo
  emailVisibility: boolean;
  role: string;
  bio?: string;
  avatar?: string;
}

/**
 * Resposta de autenticação via PocketBase.
 * authWithPassword retorna token + record.
 */
export interface AuthResponse {
  token: string;
  record: UserRecord;
}

/**
 * Retorna o usuário logado, ou undefined se não houver sessão.
 */
export const getCurrentUser = (): UserRecord | undefined => {
  const model = pb.authStore.model;
  if (!model) return undefined;
  
  // Cast do modelo do PocketBase para nosso tipo UserRecord
  const user = model as unknown as UserRecord;
  
  return user;
};

/**
 * Verifica se o usuário está autenticado
 */
export const isAuthenticated = (): boolean => {
  return pb.authStore.isValid;
};

/**
 * Faz logout do usuário
 */
export const logout = (): void => {
  pb.authStore.clear();
};

/**
 * Login com email e senha
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const authData = await pb.collection('users').authWithPassword(email, password);
  return {
    token: authData.token,
    record: authData.record as UserRecord
  };
};

/**
 * Registro de novo usuário
 */
export const register = async (data: {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  role: string;
}): Promise<UserRecord> => {
  // Derivar username obrigatório no PocketBase
  const baseUser = (data.name?.trim() || data.email.split('@')[0] || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_\-]+/g, '_')
    .slice(0, 24);
  const username = baseUser || `user_${Math.random().toString(36).slice(2, 8)}`;

  const record = await pb.collection('users').create({
    username,
    email: data.email,
    emailVisibility: true,
    password: data.password,
    passwordConfirm: data.passwordConfirm,
    name: data.name,
    role: data.role,
  });

  return record as UserRecord;
};

// Listener para mudanças no estado de autenticação
export const onAuthChange = (callback: (token: string, model: UserRecord | null) => void) => {
  return pb.authStore.onChange((token, model) => {
    callback(token, model as UserRecord | null);
  });
};

// --- Tipos de dados para Classes ---

export interface ClassRecord extends PBRecord {
  title?: string;
  name: string;
  description?: string;
  createdBy?: string;
  code?: string;
}

export interface ClassMemberRecord extends PBRecord {
  class: string;
  user: string;
  role: string;
}

export type ClassForumPostType =
  | 'aviso'
  | 'info'
  | 'conteudo'
  | 'links'
  | 'mensagens';

export interface ClassForumLink {
  label?: string;
  url: string;
}

export interface ClassForumPostRecord extends PBRecord {
  class: string;
  author: string;
  title: string;
  content?: string;
  type: ClassForumPostType;
  attachments?: string[];
  links?: ClassForumLink[] | null;
  expand?: {
    author?: UserRecord;
    class?: ClassRecord;
  };
}

export interface ClassForumCommentRecord extends PBRecord {
  post: string;
  author: string;
  content: string;
  expand?: {
    author?: UserRecord;
    post?: ClassForumPostRecord;
  };
}

export const CLASS_FORUM_TYPES: ClassForumPostType[] = [
  'aviso',
  'info',
  'conteudo',
  'links',
  'mensagens',
];

// --- Gerenciamento de Turmas/Classes ---

/**
 * Cria uma nova turma
 */
export const createClass = async (title: string, description?: string): Promise<ClassRecord> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const record = await pb.collection('classes').create({
    name: title,
    description: description || '',
    createdBy: user.id,
  });

  // Adiciona o professor como membro da turma
  try {
    await pb.collection('class_members').create({
      class: record.id,
      user: user.id,
      role: 'teacher',
    });
  } catch (error) {
    console.error('Erro ao adicionar professor como membro:', error);
  }

  return record as ClassRecord;
};

/**
 * Lista as turmas do professor logado
 */
export const listTeachingClasses = async (): Promise<ClassRecord[]> => {
  const user = getCurrentUser();
  if (!user) {
    return [];
  }

  try {
    const records = await pb.collection('classes').getFullList({
      filter: `createdBy = "${user.id}"`,
      sort: '-created',
      requestKey: `list_classes_${user.id}_${Date.now()}`,
    } as any);
    return records as ClassRecord[];
  } catch (error) {
    console.error('Erro ao listar turmas:', error);
    return [];
  }
};

/**
 * Lista todas as turmas que o usuário participa (como aluno ou professor)
 */
export const listMyClasses = async (): Promise<ClassRecord[]> => {
  const user = getCurrentUser();
  if (!user) {
    return [];
  }

  try {
    const memberships = await pb.collection('class_members').getFullList({
      filter: `user = "${user.id}"`,
      expand: 'class',
    });

    return memberships.map((m: any) => m.expand?.class).filter(Boolean) as ClassRecord[];
  } catch (error) {
    console.error('Erro ao listar minhas turmas:', error);
    return [];
  }
};

/**
 * Obtém detalhes de uma turma específica
 */
export const getClassDetails = async (classId: string): Promise<ClassRecord | null> => {
  try {
    const record = await pb.collection('classes').getOne(classId);
    return record as ClassRecord;
  } catch (error) {
    console.error('Erro ao obter detalhes da turma:', error);
    return null;
  }
};

/**
 * Obtém uma turma usando id, código ou nome.
 */
export const getClassByIdentifier = async (identifier: string): Promise<ClassRecord | null> => {
  if (!identifier?.trim()) {
    return null;
  }

  const trimmed = identifier.trim();

  try {
    const record = await pb.collection('classes').getOne(trimmed);
    return record as ClassRecord;
  } catch (error) {
    console.debug('Identificador não é um ID direto, tentando buscar por código ou nome.', error);
  }

  const safeIdentifier = trimmed.replace(/"/g, '\\"');

  try {
    const record = await pb.collection('classes').getFirstListItem(
      `code = "${safeIdentifier}" || name = "${safeIdentifier}"`,
      {
        requestKey: `class_lookup_${safeIdentifier}_${Date.now()}`,
      } as any,
    );
    return record as ClassRecord;
  } catch (error) {
    console.error('Não foi possível encontrar turma pelo identificador fornecido:', error);
    return null;
  }
};

/**
 * Verifica se o usuário autenticado participa da turma.
 */
export const isCurrentUserMemberOfClass = async (classId: string): Promise<boolean> => {
  const user = getCurrentUser();
  if (!user) {
    return false;
  }

  try {
    await pb.collection('class_members').getFirstListItem(
      `class = "${classId}" && user = "${user.id}"`,
      {
        requestKey: `class_member_check_${classId}_${user.id}_${Date.now()}`,
      } as any,
    );
    return true;
  } catch (error) {
    console.warn('Usuário não parece fazer parte da turma ou não foi possível verificar:', error);
    return false;
  }
};

/**
 * Atualiza uma turma
 */
export const updateClass = async (classId: string, data: { title?: string; description?: string }): Promise<ClassRecord> => {
  const updateData: any = {};
  
  if (data.title) {
    updateData.name = data.title;
  }
  
  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  const record = await pb.collection('classes').update(classId, updateData);
  return record as ClassRecord;
};

/**
 * Deleta uma turma
 */
export const deleteClass = async (classId: string): Promise<boolean> => {
  try {
    await pb.collection('classes').delete(classId);
    return true;
  } catch (error) {
    console.error('Erro ao deletar turma:', error);
    return false;
  }
};

/**
 * Lista os membros de uma turma
 */
export const listClassMembers = async (classId: string): Promise<any[]> => {
  try {
    // Buscar membros com requestKey único para evitar auto-cancel
    const members = await pb.collection('class_members').getFullList({
      filter: `class = "${classId}"`,
      expand: 'user',
      requestKey: `members_${classId}_${Date.now()}`,
    } as any);
    
    // Se o expand não funcionou, buscar usuários manualmente
    const membersWithUsers = await Promise.all(
      members.map(async (member: any) => {
        if (!member.expand?.user && member.user) {
          try {
            const user = await pb.collection('users').getOne(member.user, {
              requestKey: `user_${member.user}_${Date.now()}`,
            } as any);
            return {
              ...member,
              expand: {
                user: {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                }
              }
            };
          } catch (err) {
            console.warn('Não foi possível buscar dados do usuário:', err);
            return member;
          }
        }
        return member;
      })
    );
    
    return membersWithUsers;
  } catch (error) {
    console.error('Erro ao listar membros da turma:', error);
    return [];
  }
};

/**
 * Adiciona um membro à turma
 */
export const addClassMember = async (classId: string, userId: string, role: string = 'student'): Promise<boolean> => {
  try {
    await pb.collection('class_members').create({
      class: classId,
      user: userId,
      role,
    });
    return true;
  } catch (error) {
    console.error('Erro ao adicionar membro:', error);
    return false;
  }
};

/**
 * Remove um membro da turma
 */
export const removeClassMember = async (memberId: string): Promise<boolean> => {
  try {
    await pb.collection('class_members').delete(memberId);
    return true;
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    return false;
  }
};

/**
 * Busca usuários por email ou nome
 */
export const searchUsers = async (query: string): Promise<UserRecord[]> => {
  try {
    if (!query.trim()) {
      return [];
    }
    const records = await pb.collection('users').getList(1, 10, {
      filter: `email ~ "${query}" || name ~ "${query}"`,
      requestKey: `search_users_${Date.now()}`,
    } as any);
    console.log(records);
    return records.items as UserRecord[];
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
};

/**
 * Lista posts do fórum de eventos da turma.
 */
export const listClassForumPosts = async (
  classId: string,
  options?: { type?: ClassForumPostType }
): Promise<ClassForumPostRecord[]> => {
  try {
    const filters = [`class = "${classId}"`];
    const requestedType = options?.type;
    if (requestedType && CLASS_FORUM_TYPES.includes(requestedType)) {
      filters.push(`type = "${requestedType}"`);
    }

    const filter = filters.join(' && ');

    const records = await pb.collection('class_forum_posts').getFullList({
      filter,
      sort: '-created',
      expand: 'author',
      requestKey: `class_forum_posts_${classId}_${requestedType ?? 'all'}_${Date.now()}`,
    } as any);

    return records as ClassForumPostRecord[];
  } catch (error) {
    console.error('Erro ao listar posts do fórum:', error);
    return [];
  }
};

/**
 * Cria um novo post no fórum de eventos da turma.
 */
export const createClassForumPost = async (data: {
  classId: string;
  title: string;
  content?: string;
  type: ClassForumPostType;
  attachments?: File[];
  links?: ClassForumLink[];
}): Promise<ClassForumPostRecord | null> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const formData = new FormData();
    formData.append('class', data.classId);
    formData.append('author', user.id);
    formData.append('title', data.title);
    formData.append('type', data.type);

    if (data.content) {
      formData.append('content', data.content);
    }

    if (data.links && data.links.length > 0) {
      formData.append('links', JSON.stringify(data.links));
    }

    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const record = await pb.collection('class_forum_posts').create(formData);
    return record as ClassForumPostRecord;
  } catch (error) {
    console.error('Erro ao criar post do fórum:', error);
    throw error;
  }
};

/**
 * Atualiza um post existente no fórum.
 */
export const updateClassForumPost = async (
  postId: string,
  data: {
    title?: string;
    content?: string;
    type?: ClassForumPostType;
    links?: ClassForumLink[];
  }
): Promise<ClassForumPostRecord | null> => {
  try {
    const updateData: any = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    if (data.links !== undefined) {
      updateData.links = data.links;
    }

    const record = await pb.collection('class_forum_posts').update(postId, updateData);
    return record as ClassForumPostRecord;
  } catch (error) {
    console.error('Erro ao atualizar post do fórum:', error);
    throw error;
  }
};

/**
 * Remove um post do fórum.
 */
export const deleteClassForumPost = async (postId: string): Promise<boolean> => {
  try {
    await pb.collection('class_forum_posts').delete(postId);
    return true;
  } catch (error) {
    console.error('Erro ao remover post do fórum:', error);
    return false;
  }
};

/**
 * Recupera um post específico do fórum.
 */
export const getClassForumPost = async (postId: string): Promise<ClassForumPostRecord | null> => {
  try {
    const record = await pb.collection('class_forum_posts').getOne(postId, {
      expand: 'author,class',
      requestKey: `forum_post_${postId}_${Date.now()}`,
    } as any);
    return record as ClassForumPostRecord;
  } catch (error) {
    console.error('Erro ao obter post do fórum:', error);
    return null;
  }
};

/**
 * Lista comentários de um post.
 */
export const listClassForumComments = async (
  postId: string
): Promise<ClassForumCommentRecord[]> => {
  try {
    const records = await pb.collection('class_forum_comments').getFullList({
      filter: `post = "${postId}"`,
      sort: 'created',
      expand: 'author',
      requestKey: `forum_comments_${postId}_${Date.now()}`,
    } as any);

    return records as ClassForumCommentRecord[];
  } catch (error) {
    console.error('Erro ao listar comentários do fórum:', error);
    return [];
  }
};

/**
 * Cria um novo comentário em um post do fórum.
 */
export const createClassForumComment = async (
  postId: string,
  content: string
): Promise<ClassForumCommentRecord | null> => {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return null;
  }

  const user = getCurrentUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const record = await pb.collection('class_forum_comments').create({
      post: postId,
      content: trimmedContent,
      author: user.id,
    });
    return record as ClassForumCommentRecord;
  } catch (error) {
    console.error('Erro ao criar comentário no fórum:', error);
    throw error;
  }
};

/**
 * Remove um comentário (apenas autor, professor ou admin).
 */
export const deleteClassForumComment = async (commentId: string): Promise<boolean> => {
  try {
    await pb.collection('class_forum_comments').delete(commentId);
    return true;
  } catch (error) {
    console.error('Erro ao remover comentário:', error);
    return false;
  }
};

/**
 * Gera a URL completa para o avatar do usuário.
 * @param user O registro do usuário (UserRecord).
 * @param size O tamanho da imagem (opcional, para otimização).
 * @returns A URL completa do avatar ou null se não houver avatar.
 */
export const getAvatarUrl = (user: UserRecord, size: string = '80x80'): string | null => {
  if (!user.avatar) {
    return null;
  }

  // O PocketBase usa a URL base + collectionName + recordId + filename
  // O parâmetro 'thumb' é usado para redimensionamento
  return pb.files.getUrl(user, user.avatar, { thumb: size });
};
